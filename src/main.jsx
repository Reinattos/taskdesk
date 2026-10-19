import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart3, BellRing, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Flame, ListChecks, Pencil, Plus, Search, Settings, StickyNote, Sun, Trash2, X } from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'tarefas-do-dia-v1';

const defaultTasks = [
  { id: crypto.randomUUID(), title: 'Limpar email', done: false, priority: 'medium' },
  { id: crypto.randomUUID(), title: 'Formatar máquinas', done: false, priority: 'medium' }
];

const spellingCorrections = {
  aualizar: 'atualizar',
  atualisar: 'atualizar',
  conserta: 'consertar',
  consertar: 'consertar',
  concerta: 'consertar',
  email: 'email',
  emails: 'emails',
  equipamantos: 'equipamentos',
  equipamento: 'equipamento',
  equipamentos: 'equipamentos',
  estalar: 'instalar',
  formata: 'formatar',
  formatacao: 'formatação',
  formataçao: 'formatação',
  formatar: 'formatar',
  impressoa: 'impressora',
  impressora: 'impressora',
  impresora: 'impressora',
  instala: 'instalar',
  instalar: 'instalar',
  limpar: 'limpar',
  maquina: 'máquina',
  maquinas: 'máquinas',
  máquina: 'máquina',
  máquinas: 'máquinas',
  organizar: 'organizar',
  relatorio: 'relatório',
  relatorios: 'relatórios',
  senha: 'senha',
  senhas: 'senhas',
  sistema: 'sistema',
  sistemas: 'sistemas',
  tafera: 'tarefa',
  taferas: 'tarefas',
  tarefa: 'tarefa',
  tarefas: 'tarefas',
  usuario: 'usuário',
  usuarios: 'usuários',
  verificar: 'verificar'
};

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const todayKey = getDateKey(new Date());

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const storedData = Array.isArray(parsed)
        ? { activeDate: todayKey, tasksByDate: { [todayKey]: normalizeSavedTasks(parsed) } }
        : {
            activeDate: parsed.activeDate || todayKey,
            tasksByDate: normalizeTasksByDate(parsed.tasksByDate || {})
          };

      return rolloverTasks(storedData, todayKey);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return {
    activeDate: todayKey,
    tasksByDate: {
      [todayKey]: defaultTasks
    }
  };
}

function App() {
  const [taskData, setTaskData] = useState(loadTasks);
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [editingTask, setEditingTask] = useState(null);
  const [activeView, setActiveView] = useState('tasks');
  const [openReport, setOpenReport] = useState(false);
  const [lightTheme, setLightTheme] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCarriedNotice, setShowCarriedNotice] = useState(() => {
    const initialToday = getDateKey(new Date());
    return (taskData.tasksByDate[initialToday] || []).some((task) => task.carriedFrom);
  });
  const newTaskInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date());
  const todayKey = getDateKey(new Date());
  const tasks = taskData.tasksByDate[todayKey] || [];
  const reportDates = Object.keys(taskData.tasksByDate).sort((a, b) => b.localeCompare(a));
  const selectedReport = openReport ? taskData.tasksByDate[openReport] || [] : [];
  const selectedReportDone = selectedReport.filter((task) => task.done);
  const selectedReportPending = selectedReport.filter((task) => !task.done);
  const selectedReportTasks = [...selectedReportDone, ...selectedReportPending];

  useEffect(() => {
    const updateForNewDay = () => {
      const nextDateKey = getDateKey(new Date());
      setTaskData((currentData) => {
        if (currentData.activeDate === nextDateKey && currentData.tasksByDate[nextDateKey]) {
          return currentData;
        }

        const nextData = rolloverTasks(currentData, nextDateKey);
        if ((nextData.tasksByDate[nextDateKey] || []).some((task) => task.carriedFrom)) {
          setShowCarriedNotice(true);
        }
        return nextData;
      });
    };

    const intervalId = window.setInterval(updateForNewDay, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function handleShortcut(event) {
      const target = event.target;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;

      if (event.key === 'Escape') {
        setEditingTask(null);
        setOpenReport(false);
        setShowCarriedNotice(false);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!typing && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        newTaskInputRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  function persist(nextTaskData) {
    setTaskData(nextTaskData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTaskData));
  }

  function persistToday(nextTasks) {
    persist({
      activeDate: todayKey,
      tasksByDate: {
        ...taskData.tasksByDate,
        [todayKey]: nextTasks
      }
    });
  }

  function addTask(event) {
    event.preventDefault();
    const title = normalizeTaskTitle(newTask);
    if (!title) return;
    persistToday([{ id: crypto.randomUUID(), title, done: false, priority: newTaskPriority }, ...tasks]);
    setNewTask('');
    setNewTaskPriority('medium');
  }

  function updateTask(id, title, note, priority) {
    const normalizedTitle = normalizeTaskTitle(title);
    if (!normalizedTitle) return;
    persistToday(tasks.map((task) => (task.id === id ? { ...task, title: normalizedTitle, note: note.trim(), priority } : task)));
    setEditingTask(null);
  }

  function toggleTask(id) {
    persistToday(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function deleteTask(id) {
    if (!window.confirm('Deseja excluir esta tarefa?')) return;
    persistToday(tasks.filter((task) => task.id !== id));
  }

  const pendingTasks = tasks.filter((task) => !task.done);
  const doneTasks = tasks.filter((task) => task.done);
  const progress = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const completionStreak = getCompletionStreak(taskData.tasksByDate, todayKey);
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR');
  const matchingTasks = tasks.filter((task) => `${task.title} ${task.note || ''}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch));
  const orderedTasks = [...matchingTasks].sort((firstTask, secondTask) => {
    if (firstTask.done !== secondTask.done) return firstTask.done ? -1 : 1;
    return getPriorityRank(secondTask.priority) - getPriorityRank(firstTask.priority);
  });

  return (
    <main className={`page ${lightTheme ? 'light-theme' : ''}`}>
      <aside className="sidebar" aria-label="Menu lateral">
        <div className="sidebar-brand">
          <div className="brand-symbol" aria-hidden="true">
            <ListChecks size={25} strokeWidth={2.4} />
          </div>
          <div className="brand-wordmark">
            <strong><span>Task</span><em>Desk</em></strong>
            <small>Organização diária</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeView === 'tasks' ? 'active' : ''}`} type="button" onClick={() => setActiveView('tasks')}>
            <ClipboardList size={20} />
            <span>Tarefas</span>
          </button>
          <button className={`nav-item ${activeView === 'reports' ? 'active' : ''}`} type="button" onClick={() => setActiveView('reports')}>
            <BarChart3 size={20} />
            <span>Relatórios</span>
          </button>
          <button className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} type="button" onClick={() => setActiveView('settings')}>
            <Settings size={20} />
            <span>Configurações</span>
          </button>
        </nav>

        <button className="theme-toggle" type="button" onClick={() => setLightTheme((current) => !current)}>
          <Sun size={20} />
          <span>{lightTheme ? 'Modo escuro' : 'Tema claro'}</span>
        </button>
      </aside>

      <section className="task-board">
        {activeView === 'tasks' ? (
          <>
            <section className="top-panel">
              <header className="header">
                <div>
                  <h1>Tarefas diárias</h1>
                  <p>{today.charAt(0).toUpperCase() + today.slice(1)}</p>
                </div>
                <span>Hoje</span>
              </header>

              <section className="summary-grid" aria-label="Resumo das tarefas">
                <article>
                  <strong>{tasks.length}</strong>
                  <span>Total</span>
                </article>
                <article>
                  <strong>{doneTasks.length}</strong>
                  <span>Concluídas</span>
                </article>
                <article>
                  <strong>{pendingTasks.length}</strong>
                  <span>Pendentes</span>
                </article>
              </section>

              <section className="daily-progress" aria-label="Progresso do dia">
                <div>
                  <span>Progresso do dia</span>
                  <strong>{doneTasks.length} de {tasks.length} concluídas</strong>
                </div>
                <span className="progress-value">{progress}%</span>
                <div className="progress-track" aria-hidden="true">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </section>

              <section className="streak-card" aria-label="Sequência de dias concluídos">
                <span className="streak-icon" aria-hidden="true"><Flame size={20} /></span>
                <div>
                  <strong>{completionStreak} dia{completionStreak === 1 ? '' : 's'} de sequência</strong>
                  <span>{completionStreak ? 'Você concluiu todas as tarefas nestes dias.' : 'Conclua todas as tarefas de hoje para iniciar uma sequência.'}</span>
                </div>
              </section>

            </section>

            {showCarriedNotice && (
              <section className="carried-notice" role="status">
                <BellRing size={20} aria-hidden="true" />
                <div>
                  <strong>Pendências trazidas de outro dia</strong>
                  <span>As tarefas não concluídas foram incluídas na lista de hoje.</span>
                </div>
                <button type="button" onClick={() => setShowCarriedNotice(false)} title="Fechar aviso" aria-label="Fechar aviso">
                  <X size={18} />
                </button>
              </section>
            )}

            <form className="add-task" onSubmit={addTask}>
              <input
                ref={newTaskInputRef}
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
                placeholder="Digite uma tarefa"
                autoFocus
              />
              <select value={newTaskPriority} onChange={(event) => setNewTaskPriority(event.target.value)} aria-label="Prioridade da nova tarefa">
                <option value="low">Prioridade baixa</option>
                <option value="medium">Prioridade média</option>
                <option value="high">Prioridade alta</option>
              </select>
              <button type="submit" title="Adicionar tarefa">
                <Plus size={20} />
                Adicionar tarefa
              </button>
            </form>

            <section className="tasks-panel">
              <div className="tasks-heading">
                <div>
                  <h2>Tarefas</h2>
                  <p>N para nova tarefa. Ctrl + K para buscar.</p>
                </div>
                <label className="task-search">
                  <Search size={17} />
                  <input ref={searchInputRef} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar tarefa" />
                </label>
              </div>
              <div className="task-list" aria-label="Lista de tarefas">
                {tasks.length === 0 ? (
                  <p className="empty-state">Adicione a primeira tarefa do dia.</p>
                ) : orderedTasks.length === 0 ? (
                  <p className="empty-state">Nenhuma tarefa encontrada.</p>
                ) : (
                  orderedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      editing={editingTask === task.id}
                      onStartEdit={() => setEditingTask(task.id)}
                      onCancelEdit={() => setEditingTask(null)}
                      onSaveEdit={updateTask}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                    />
                  ))
                )}
              </div>
            </section>
          </>
        ) : activeView === 'reports' ? (
          <ReportsView
            reportDates={reportDates}
            tasksByDate={taskData.tasksByDate}
            onOpenReport={setOpenReport}
          />
        ) : (
          <SettingsView lightTheme={lightTheme} onToggleTheme={() => setLightTheme((current) => !current)} />
        )}
      </section>

      {openReport && (
        <ReportModal
          reportDate={formatShortDate(openReport)}
          tasks={selectedReportTasks}
          total={selectedReport.length}
          done={selectedReportDone.length}
          pending={selectedReportPending.length}
          onClose={() => setOpenReport(false)}
        />
      )}
    </main>
  );
}

function ReportsView({ reportDates, tasksByDate, onOpenReport }) {
  return (
    <section className="reports-panel">
      <header className="header">
        <div>
          <h1>Relatórios</h1>
          <p>Histórico das tarefas por dia.</p>
        </div>
      </header>

      <WeeklyOverview tasksByDate={tasksByDate} onOpenReport={onOpenReport} />
      <TaskCalendar tasksByDate={tasksByDate} onOpenReport={onOpenReport} />

      <div className="reports-list">
        {reportDates.map((dateKey) => {
          const reportTasks = tasksByDate[dateKey] || [];
          const done = reportTasks.filter((task) => task.done).length;
          const pending = reportTasks.filter((task) => !task.done).length;
          return (
            <button className="report-card" type="button" onClick={() => onOpenReport(dateKey)} key={dateKey}>
              <div className="report-icon">
                <CalendarDays size={22} />
              </div>
              <div>
                <strong>{formatShortDate(dateKey)} Relatório de tarefas</strong>
                <span>{reportTasks.length} tarefa{reportTasks.length === 1 ? '' : 's'} / {done} concluída{done === 1 ? '' : 's'} / {pending} pendente{pending === 1 ? '' : 's'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function WeeklyOverview({ tasksByDate, onOpenReport }) {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
    const dateKey = getDateKey(date);
    const tasks = tasksByDate[dateKey] || [];
    const done = tasks.filter((task) => task.done).length;
    const total = tasks.length;
    return {
      dateKey,
      label: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', ''),
      done,
      total,
      progress: total ? Math.round((done / total) * 100) : 0
    };
  });
  const weeklyDone = weekDays.reduce((total, day) => total + day.done, 0);
  const weeklyTasks = weekDays.reduce((total, day) => total + day.total, 0);
  const weeklyProgress = weeklyTasks ? Math.round((weeklyDone / weeklyTasks) * 100) : 0;

  return (
    <section className="weekly-overview" aria-label="Resumo semanal">
      <div className="weekly-heading">
        <div>
          <h2>Resumo semanal</h2>
          <p>Últimos 7 dias</p>
        </div>
        <strong>{weeklyProgress}% concluído</strong>
      </div>

      <div className="weekly-bars">
        {weekDays.map((day) => (
          <button className="weekly-day" type="button" key={day.dateKey} onClick={() => onOpenReport(day.dateKey)} title={`${formatShortDate(day.dateKey)}: ${day.done} de ${day.total} concluídas`}>
            <span className="weekly-bar-track"><i className={day.progress === 100 && day.total ? 'complete' : ''} style={{ height: `${day.progress}%` }} /></span>
            <strong>{day.label}</strong>
            <small>{day.done}/{day.total}</small>
          </button>
        ))}
      </div>

      <div className="weekly-totals">
        <span><strong>{weeklyDone}</strong> concluídas</span>
        <span><strong>{Math.max(weeklyTasks - weeklyDone, 0)}</strong> pendentes</span>
        <span><strong>{weeklyTasks}</strong> tarefas</span>
      </div>
    </section>
  );
}

function TaskCalendar({ tasksByDate, onOpenReport }) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(visibleMonth);
  const todayKey = getDateKey(new Date());
  const calendarCells = Array.from({ length: firstWeekday + totalDays }, (_, index) => {
    if (index < firstWeekday) return null;
    const day = index - firstWeekday + 1;
    const dateKey = getDateKey(new Date(year, month, day));
    const tasks = tasksByDate[dateKey] || [];
    return { day, dateKey, count: tasks.length, done: tasks.filter((task) => task.done).length };
  });

  return (
    <section className="task-calendar" aria-label="Calendário de tarefas">
      <div className="calendar-header">
        <div>
          <h2>Calendário</h2>
          <p>Selecione uma data para abrir o relatório.</p>
        </div>
        <div className="calendar-controls">
          <button type="button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} title="Mês anterior" aria-label="Mês anterior">
            <ChevronLeft size={18} />
          </button>
          <strong>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</strong>
          <button type="button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} title="Próximo mês" aria-label="Próximo mês">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-grid">
        {calendarCells.map((cell, index) => cell ? (
          <button
            className={`calendar-day ${cell.dateKey === todayKey ? 'today' : ''} ${cell.count ? 'has-tasks' : ''}`}
            type="button"
            onClick={() => onOpenReport(cell.dateKey)}
            key={cell.dateKey}
            title={cell.count ? `${cell.count} tarefa${cell.count === 1 ? '' : 's'} neste dia` : 'Sem tarefas neste dia'}
          >
            <span>{cell.day}</span>
            {cell.count > 0 && <small>{cell.done}/{cell.count}</small>}
          </button>
        ) : <span className="calendar-empty" key={`empty-${index}`} />)}
      </div>
    </section>
  );
}

function SettingsView({ lightTheme, onToggleTheme }) {
  return (
    <section className="settings-panel">
      <header className="header">
        <div>
          <h1>Configurações</h1>
          <p>Personalize a aparência do TaskDesk.</p>
        </div>
      </header>
      <section className="settings-group">
        <div>
          <strong>Aparência</strong>
          <span>Escolha o tema mais confortável para o seu trabalho.</span>
        </div>
        <button className="settings-switch" type="button" onClick={onToggleTheme} aria-pressed={lightTheme}>
          <Sun size={19} />
          <span>{lightTheme ? 'Tema claro ativo' : 'Tema escuro ativo'}</span>
          <i aria-hidden="true" />
        </button>
      </section>
    </section>
  );
}

function ReportModal({ reportDate, tasks, total, done, pending, onClose }) {
  const [filter, setFilter] = useState('all');
  const filteredTasks = tasks.filter((task) => filter === 'all' || (filter === 'done' ? task.done : !task.done));

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="report-modal">
        <header className="modal-header">
          <div>
            <p>{reportDate}</p>
            <h2>Relatório de tarefas</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} title="Fechar relatório">
            <X size={20} />
          </button>
        </header>

        <section className="modal-summary" aria-label="Resumo do relatório">
          <span>Total: <strong>{total}</strong></span>
          <span>Concluídas: <strong>{done}</strong></span>
          <span>Pendentes: <strong>{pending}</strong></span>
        </section>

        <div className="report-filters" aria-label="Filtrar tarefas do relatório">
          <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todas</button>
          <button type="button" className={filter === 'done' ? 'active' : ''} onClick={() => setFilter('done')}>Concluídas</button>
          <button type="button" className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pendentes</button>
        </div>

        <div className="report-task-list">
          {filteredTasks.length === 0 ? (
            <p className="empty-state">Nenhuma tarefa neste filtro.</p>
          ) : (
            filteredTasks.map((task) => (
              <article className="report-task" key={task.id}>
                <span className={`report-dot ${task.done ? 'complete' : 'pending'}`} />
                <div>
                  <span>{task.title}</span>
                  {task.note && <small>{task.note}</small>}
                </div>
                <span className={`priority-badge ${task.priority || 'medium'}`}>{priorityLabel(task.priority)}</span>
                <span className={`status-badge ${task.done ? 'complete' : 'pending'}`}>
                  {task.done ? 'Concluído' : 'Pendente'}
                </span>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function TaskItem({ task, editing, onStartEdit, onCancelEdit, onSaveEdit, onToggle, onDelete }) {
  const [draft, setDraft] = useState(task.title);
  const [noteDraft, setNoteDraft] = useState(task.note || '');
  const [priorityDraft, setPriorityDraft] = useState(task.priority || 'medium');

  useEffect(() => {
    if (editing) {
      setDraft(task.title);
      setNoteDraft(task.note || '');
      setPriorityDraft(task.priority || 'medium');
    }
  }, [editing, task.note, task.title]);

  function submitEdit(event) {
    event.preventDefault();
    onSaveEdit(task.id, draft, noteDraft, priorityDraft);
  }

  if (editing) {
    return (
      <form className="task-item editing" onSubmit={submitEdit}>
        <button type="button" className="check-button" onClick={() => onToggle(task.id)} title={task.done ? 'Marcar como pendente' : 'Marcar como concluída'}>
          {task.done && <Check size={17} />}
        </button>
        <div className="edit-fields">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} autoFocus aria-label="Título da tarefa" />
          <label>
            <StickyNote size={15} />
            <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Adicionar uma nota" rows="2" />
          </label>
          <select value={priorityDraft} onChange={(event) => setPriorityDraft(event.target.value)} aria-label="Prioridade da tarefa">
            <option value="low">Prioridade baixa</option>
            <option value="medium">Prioridade média</option>
            <option value="high">Prioridade alta</option>
          </select>
        </div>
        <button type="submit" className="edit-button visible" title="Salvar edição">
          <CheckCircle2 size={18} />
        </button>
        <button type="button" className="delete-button visible" onClick={onCancelEdit} title="Cancelar edição">
          <X size={18} />
        </button>
      </form>
    );
  }

  return (
    <article className={`task-item ${task.done ? 'done' : ''}`}>
      <button className="check-button" onClick={() => onToggle(task.id)} title={task.done ? 'Marcar como pendente' : 'Marcar como concluída'}>
        {task.done && <Check size={17} />}
      </button>
      <div className="task-content">
        <span className="task-title">{task.title}</span>
        {task.note && <small className="task-note">{task.note}</small>}
      </div>
      <span className={`priority-badge ${task.priority || 'medium'}`}>{priorityLabel(task.priority)}</span>
      <span className={`status-badge ${task.done ? 'complete' : 'pending'}`}>
        {task.done ? 'Concluído' : 'Pendente'}
      </span>
      <button className="edit-button" onClick={onStartEdit} title="Editar tarefa">
        <Pencil size={18} />
      </button>
      <button className="delete-button" onClick={() => onDelete(task.id)} title="Excluir tarefa">
        <Trash2 size={18} />
      </button>
    </article>
  );
}

function normalizeTaskTitle(text) {
  const correctedText = text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      const match = word.match(/^([A-Za-zÀ-ÿ]+)([^A-Za-zÀ-ÿ]*)$/);
      if (!match) return word;
      const [, baseWord, punctuation] = match;
      const corrected = spellingCorrections[baseWord.toLocaleLowerCase('pt-BR')] || baseWord;
      return `${corrected}${punctuation}`;
    })
    .join(' ');

  return correctedText
    ? correctedText.charAt(0).toLocaleUpperCase('pt-BR') + correctedText.slice(1)
    : correctedText;
}

function normalizeSavedTasks(tasks) {
  return tasks.map((task) => ({
    ...task,
    title: task.title === 'Formatar maquinas' ? 'Formatar máquinas' : task.title,
    note: typeof task.note === 'string' ? task.note : '',
    priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium'
  }));
}

function priorityLabel(priority) {
  const labels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
  return labels[priority] || labels.medium;
}

function getPriorityRank(priority) {
  const ranks = { low: 1, medium: 2, high: 3 };
  return ranks[priority] || ranks.medium;
}

function getCompletionStreak(tasksByDate, todayKey) {
  let streak = 0;
  let currentDate = dateFromKey(todayKey);

  while (true) {
    const dateKey = getDateKey(currentDate);
    const tasks = tasksByDate[dateKey] || [];
    const allComplete = tasks.length > 0 && tasks.every((task) => task.done);
    if (!allComplete) break;
    streak += 1;
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
  }

  return streak;
}

function normalizeTasksByDate(tasksByDate) {
  return Object.fromEntries(
    Object.entries(tasksByDate).map(([dateKey, tasks]) => [
      dateKey,
      Array.isArray(tasks) ? normalizeSavedTasks(tasks) : []
    ])
  );
}

function rolloverTasks(data, todayKey) {
  const tasksByDate = { ...data.tasksByDate };
  if (!tasksByDate[todayKey]) {
    const previousTasks = tasksByDate[data.activeDate] || [];
    const carriedTasks = previousTasks
      .filter((task) => !task.done)
      .map((task) => ({ ...task, id: crypto.randomUUID(), carriedFrom: data.activeDate }));
    tasksByDate[todayKey] = carriedTasks;
  }

  const nextData = {
    activeDate: todayKey,
    tasksByDate
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
  return nextData;
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(dateKey) {
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

createRoot(document.getElementById('root')).render(<App />);
