import React, { useState, useEffect } from 'react';
import { apiRequest, getToken, setToken, getUserRole, setUserRole } from './api';

export default function App() {
  const [token, setAuthToken] = useState(getToken());
  const [role, setRole] = useState(getUserRole());
  const [activeTab, setActiveTab] = useState('books');
  const [notification, setNotification] = useState(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('Admin1234*');
  const [loginLoading, setLoginLoading] = useState(false);

  // Books state
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [booksLoading, setBooksLoading] = useState(false);

  // New Book Modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category_id: '', total_copies: 3 });

  // Members state
  const [members, setMembers] = useState([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [newMember, setNewMember] = useState({ full_name: '', document_number: '' });

  // Loans state
  const [loans, setLoans] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [newLoanMember, setNewLoanMember] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState([]);

  // Report state
  const [reportFrom, setReportFrom] = useState('2026-01-01');
  const [reportTo, setReportTo] = useState('2026-12-31');
  const [reportRows, setReportRows] = useState([]);

  const notify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Auth handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      setToken(res.access_token);
      setUserRole(res.role);
      setAuthToken(res.access_token);
      setRole(res.role);
      notify(`Bienvenido, sesión iniciada como ${res.role}.`, 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserRole(null);
    setAuthToken(null);
    setRole(null);
    notify('Sesión cerrada correctamente.', 'info');
  };

  // Fetch initial data
  useEffect(() => {
    if (token) {
      loadCategories();
      loadBooks();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'books') loadBooks();
    if (activeTab === 'members') loadMembers();
    if (activeTab === 'loans') {
      loadLoans();
      loadMembers();
      loadBooks();
    }
    if (activeTab === 'overdue') loadOverdue();
    if (activeTab === 'reports') loadReport();
  }, [activeTab]);

  const loadCategories = async () => {
    try {
      const data = await apiRequest('/categories');
      setCategories(data);
      if (data.length > 0 && !newBook.category_id) {
        setNewBook((b) => ({ ...b, category_id: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBooks = async () => {
    setBooksLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('category_id', selectedCategory);
      params.append('size', '50');

      const data = await apiRequest(`/books?${params.toString()}`);
      setBooks(data.items || []);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBooksLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (memberQuery) params.append('q', memberQuery);
      params.append('size', '50');
      const data = await apiRequest(`/members?${params.toString()}`);
      setMembers(data.items || []);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const loadLoans = async () => {
    try {
      const data = await apiRequest('/loans?size=50');
      setLoans(data.items || []);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const loadOverdue = async () => {
    try {
      const data = await apiRequest('/loans/overdue');
      setOverdueItems(data.items || []);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const loadReport = async () => {
    try {
      const data = await apiRequest(`/reports/most-borrowed?from=${reportFrom}&to=${reportTo}`);
      setReportRows(data.rows || []);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Actions
  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/books', {
        method: 'POST',
        body: JSON.stringify({
          ...newBook,
          total_copies: parseInt(newBook.total_copies, 10),
        }),
      });
      notify('Libro agregado exitosamente al catálogo.', 'success');
      setShowBookModal(false);
      setNewBook({ title: '', author: '', isbn: '', category_id: categories[0]?.id || '', total_copies: 3 });
      loadBooks();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteBook = async (id, title) => {
    if (!confirm(`¿Dar de baja lógica al libro «${title}»?`)) return;
    try {
      await apiRequest(`/books/${id}`, { method: 'DELETE' });
      notify(`Libro «${title}» dado de baja correctamente.`, 'success');
      loadBooks();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/members', {
        method: 'POST',
        body: JSON.stringify(newMember),
      });
      notify('Socio registrado exitosamente.', 'success');
      setNewMember({ full_name: '', document_number: '' });
      loadMembers();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!newLoanMember) {
      notify('Seleccione un socio para el préstamo.', 'error');
      return;
    }
    if (selectedBookIds.length < 1 || selectedBookIds.length > 3) {
      notify('Debe seleccionar entre 1 y 3 libros.', 'error');
      return;
    }

    try {
      await apiRequest('/loans', {
        method: 'POST',
        body: JSON.stringify({
          member_id: newLoanMember,
          items: selectedBookIds.map((id) => ({ book_id: id })),
        }),
      });
      notify('Préstamo registrado exitosamente.', 'success');
      setSelectedBookIds([]);
      setNewLoanMember('');
      loadLoans();
      loadBooks();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleReturnItem = async (loanId, itemId, bookTitle) => {
    try {
      await apiRequest(`/loans/${loanId}/items/${itemId}/return`, { method: 'POST' });
      notify(`Ejemplar «${bookTitle}» devuelto exitosamente.`, 'success');
      loadLoans();
      loadBooks();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const toggleBookSelection = (id) => {
    if (selectedBookIds.includes(id)) {
      setSelectedBookIds(selectedBookIds.filter((bId) => bId !== id));
    } else {
      if (selectedBookIds.length >= 3) {
        notify('Máximo 3 libros por préstamo.', 'error');
        return;
      }
      setSelectedBookIds([...selectedBookIds, id]);
    }
  };

  // If unauthenticated: render Login Screen
  if (!token) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="logo-header">
            <span className="logo-icon">📚</span>
            <h1>Manager<strong>Library</strong></h1>
            <p className="subtitle">Ficha ADSO 3413974 · Sistema de Gestión</p>
          </div>

          {notification && (
            <div className={`alert alert-${notification.type}`}>{notification.msg}</div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Usuario</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin o ana"
                required
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loginLoading}>
              {loginLoading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
            </button>
          </form>

          <div className="demo-credentials">
            <strong>Credenciales de Demostración:</strong>
            <div>Admin: <code>admin</code> / <code>Admin1234*</code></div>
            <div>Bibliotecario: <code>ana</code> / <code>Librarian123*</code></div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="logo-icon">📚</span>
          <span>Manager<strong>Library</strong></span>
        </div>

        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            Catálogo
          </button>
          <button
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Socios
          </button>
          <button
            className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
            onClick={() => setActiveTab('loans')}
          >
            Préstamos
          </button>
          <button
            className={`tab-btn ${activeTab === 'overdue' ? 'active' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            Vencidos
          </button>
          {role === 'admin' && (
            <button
              className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reportes
            </button>
          )}
        </nav>

        <div className="navbar-user">
          <span className={`badge badge-${role}`}>{role.toUpperCase()}</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Global Notification */}
      {notification && (
        <div className={`notification-toast alert-${notification.type}`}>
          {notification.msg}
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {/* TAB: BOOKS CATALOG */}
        {activeTab === 'books' && (
          <section>
            <div className="section-title-bar">
              <div>
                <h2>Catálogo de Libros</h2>
                <p className="subtitle">Exploración y gestión del acervo bibliográfico</p>
              </div>
              {role === 'admin' && (
                <button onClick={() => setShowBookModal(true)} className="btn btn-primary">
                  + Nuevo Libro
                </button>
              )}
            </div>

            <div className="filter-bar">
              <input
                type="text"
                placeholder="Buscar por título o autor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadBooks()}
              />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setTimeout(loadBooks, 50);
                }}
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button onClick={loadBooks} className="btn btn-secondary">
                Buscar
              </button>
            </div>

            {booksLoading ? (
              <p className="loading-state">Cargando catálogo...</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Autor</th>
                      <th>ISBN-13</th>
                      <th>Categoría</th>
                      <th>Total</th>
                      <th>Disponibles</th>
                      {role === 'admin' && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((b) => (
                      <tr key={b.id}>
                        <td className="font-semibold">{b.title}</td>
                        <td>{b.author}</td>
                        <td><code>{b.isbn}</code></td>
                        <td>
                          <span className="category-pill">{b.category?.name}</span>
                        </td>
                        <td>{b.total_copies}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              b.available_copies > 0 ? 'status-open' : 'status-overdue'
                            }`}
                          >
                            {b.available_copies} disponibles
                          </span>
                        </td>
                        {role === 'admin' && (
                          <td>
                            <button
                              onClick={() => handleDeleteBook(b.id, b.title)}
                              className="btn-danger-sm"
                            >
                              Baja
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB: MEMBERS */}
        {activeTab === 'members' && (
          <section>
            <div className="section-title-bar">
              <div>
                <h2>Socios de la Biblioteca</h2>
                <p className="subtitle">Registro y consulta de usuarios autorizados para préstamos</p>
              </div>
            </div>

            <div className="grid-2-cols">
              <div className="card-panel">
                <h3>Registrar Nuevo Socio</h3>
                <form onSubmit={handleCreateMember}>
                  <div className="form-group">
                    <label>Nombre Completo</label>
                    <input
                      type="text"
                      value={newMember.full_name}
                      onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Número de Documento</label>
                    <input
                      type="text"
                      value={newMember.document_number}
                      onChange={(e) => setNewMember({ ...newMember, document_number: e.target.value })}
                      placeholder="Ej. 1020304050"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Guardar Socio
                  </button>
                </form>
              </div>

              <div>
                <div className="filter-bar">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o documento..."
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadMembers()}
                  />
                  <button onClick={loadMembers} className="btn btn-secondary">
                    Buscar
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Documento</th>
                        <th>ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id}>
                          <td className="font-semibold">{m.full_name}</td>
                          <td><code>{m.document_number}</code></td>
                          <td className="text-muted"><small>{m.id.slice(0, 8)}...</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB: LOANS */}
        {activeTab === 'loans' && (
          <section>
            <div className="section-title-bar">
              <div>
                <h2>Gestión de Préstamos</h2>
                <p className="subtitle">Registro de operaciones atómicas y control de devoluciones</p>
              </div>
            </div>

            <div className="card-panel mb-24">
              <h3>Registrar Préstamo (1 a 3 Libros)</h3>
              <form onSubmit={handleCreateLoan}>
                <div className="form-group">
                  <label>Socio que solicita</label>
                  <select
                    value={newLoanMember}
                    onChange={(e) => setNewLoanMember(e.target.value)}
                    required
                  >
                    <option value="">Seleccione un socio...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.document_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Libros seleccionados ({selectedBookIds.length} de 3 máx.):</label>
                  <div className="book-picker-grid">
                    {books.filter((b) => b.available_copies > 0).slice(0, 15).map((b) => (
                      <div
                        key={b.id}
                        className={`picker-card ${selectedBookIds.includes(b.id) ? 'selected' : ''}`}
                        onClick={() => toggleBookSelection(b.id)}
                      >
                        <strong>{b.title}</strong>
                        <small>{b.category?.name} · Disp: {b.available_copies}</small>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={selectedBookIds.length === 0}
                >
                  Confirmar Préstamo ({selectedBookIds.length} libros)
                </button>
              </form>
            </div>

            <h3>Historial de Préstamos</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha Préstamo</th>
                    <th>Estado</th>
                    <th>Líneas de Préstamo</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l) => (
                    <tr key={l.id}>
                      <td>{new Date(l.loaned_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-pill status-${l.status}`}>
                          {l.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <ul className="items-list">
                          {l.items?.map((it) => (
                            <li key={it.id} className="loan-line-item">
                              <span>
                                <strong>{it.book_title}</strong> (Vence: {new Date(it.due_at).toLocaleDateString()})
                              </span>
                              {it.returned_at ? (
                                <span className="returned-badge">Devuelto</span>
                              ) : (
                                <button
                                  onClick={() => handleReturnItem(l.id, it.id, it.book_title)}
                                  className="btn-return-sm"
                                >
                                  Devolver
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB: OVERDUE BOOKS */}
        {activeTab === 'overdue' && (
          <section>
            <div className="section-title-bar">
              <div>
                <h2>Libros Vencidos</h2>
                <p className="subtitle">Líneas de préstamo sin devolver con plazo de 14 días superado</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Libro</th>
                    <th>Socio</th>
                    <th>Fecha de Vencimiento</th>
                    <th>Días de Retraso</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center">No hay libros vencidos pendientes.</td>
                    </tr>
                  ) : (
                    overdueItems.map((ov) => (
                      <tr key={ov.item_id}>
                        <td className="font-semibold">{ov.book_title}</td>
                        <td>{ov.member_name}</td>
                        <td>{new Date(ov.due_at).toLocaleDateString()}</td>
                        <td>
                          <span className="status-pill status-overdue">
                            {ov.days_late} días tarde
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB: REPORTS */}
        {activeTab === 'reports' && (
          <section>
            <div className="section-title-bar">
              <div>
                <h2>Reporte de Libros Más Prestados</h2>
                <p className="subtitle">Consolidado histórico inmutable por rango temporal (ADR-004)</p>
              </div>
            </div>

            <div className="filter-bar">
              <label>Desde:</label>
              <input
                type="date"
                value={reportFrom}
                onChange={(e) => setReportFrom(e.target.value)}
              />
              <label>Hasta:</label>
              <input
                type="date"
                value={reportTo}
                onChange={(e) => setReportTo(e.target.value)}
              />
              <button onClick={loadReport} className="btn btn-primary">
                Generar Reporte
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th># Ranking</th>
                    <th>Título del Libro</th>
                    <th>Categoría Congelada</th>
                    <th>Veces Prestado</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center">No se registraron préstamos en este periodo.</td>
                    </tr>
                  ) : (
                    reportRows.map((row, idx) => (
                      <tr key={row.book_id}>
                        <td><strong>#{idx + 1}</strong></td>
                        <td className="font-semibold">{row.book_title}</td>
                        <td>
                          <span className="category-pill">{row.category_name}</span>
                        </td>
                        <td>
                          <span className="badge badge-admin">{row.times_borrowed} veces</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Modal New Book */}
      {showBookModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Nuevo Libro para el Catálogo</h3>
            <form onSubmit={handleCreateBook}>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="Ej. Cien años de soledad"
                  required
                />
              </div>

              <div className="form-group">
                <label>Autor</label>
                <input
                  type="text"
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  placeholder="Ej. Gabriel García Márquez"
                  required
                />
              </div>

              <div className="form-group">
                <label>ISBN (13 dígitos)</label>
                <input
                  type="text"
                  value={newBook.isbn}
                  onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                  placeholder="9780307474728"
                  required
                />
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={newBook.category_id}
                  onChange={(e) => setNewBook({ ...newBook, category_id: e.target.value })}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Total de Ejemplares</label>
                <input
                  type="number"
                  min="1"
                  value={newBook.total_copies}
                  onChange={(e) => setNewBook({ ...newBook, total_copies: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBookModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Libro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
