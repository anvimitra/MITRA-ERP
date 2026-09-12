import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { LibraryBookItem, LibraryIssueItem, Student } from '../types';
import {
  BookOpen,
  Search,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Bookmark,
  Calendar,
  User,
  Hash,
} from 'lucide-react';

interface LibraryDeskProps {
  students?: Student[];
  staffList?: any[];
}

export const LibraryDesk: React.FC<LibraryDeskProps> = ({ students: propStudents, staffList: propStaffList }) => {
  const [internalStudents, setInternalStudents] = useState<Student[]>([]);
  const [internalStaff, setInternalStaff] = useState<any[]>([]);
  const students = (propStudents && propStudents.length > 0) ? propStudents : internalStudents;
  const staffList = (propStaffList && propStaffList.length > 0) ? propStaffList : internalStaff;

  useEffect(() => {
    if (!propStudents || propStudents.length === 0) {
      ApiService.getStudents().then(res => setInternalStudents(res.students || [])).catch(() => {});
    }
    if (!propStaffList || propStaffList.length === 0) {
      ApiService.getStaff().then(res => setInternalStaff(res.staff || [])).catch(() => {});
    }
  }, [propStudents, propStaffList]);

  const [subTab, setSubTab] = useState<'catalog' | 'issues'>('catalog');

  // Books
  const [books, setBooks] = useState<LibraryBookItem[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');
  const [bookPublisher, setBookPublisher] = useState('');
  const [bookSubject, setBookSubject] = useState('Mathematics');
  const [bookRack, setBookRack] = useState('Rack A1');
  const [bookCopies, setBookCopies] = useState(10);
  const [bookPrice, setBookPrice] = useState(350);

  // Issues
  const [issues, setIssues] = useState<LibraryIssueItem[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [borrowerType, setBorrowerType] = useState<'student' | 'staff'>('student');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoadingBooks(true);
      setLoadingIssues(true);
      const [bRes, iRes] = await Promise.all([
        ApiService.getLibraryBooks(),
        ApiService.getLibraryIssues(),
      ]);
      setBooks(bRes.books || []);
      setIssues(iRes.issues || []);
    } catch (err: any) {
      console.error('Error loading library desk:', err);
    } finally {
      setLoadingBooks(false);
      setLoadingIssues(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createLibraryBook({
        title: bookTitle,
        author: bookAuthor,
        isbn: bookIsbn,
        publisher: bookPublisher,
        subject: bookSubject,
        rackNumber: bookRack,
        totalCopies: bookCopies,
        price: bookPrice,
      });
      alert('✅ Book added to library catalog!');
      setShowBookModal(false);
      setBookTitle('');
      setBookAuthor('');
      setBookIsbn('');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedBorrowerId) {
      alert('Please select both a book and a borrower.');
      return;
    }

    try {
      await ApiService.issueLibraryBook({
        bookId: selectedBookId,
        studentId: borrowerType === 'student' ? selectedBorrowerId : undefined,
        staffUserId: borrowerType === 'staff' ? selectedBorrowerId : undefined,
        dueDate: dueDate || undefined,
      });
      alert('✅ Book issued successfully!');
      setShowIssueModal(false);
      setSelectedBookId('');
      setSelectedBorrowerId('');
      loadData();
    } catch (err: any) {
      alert('Issue failed: ' + err.message);
    }
  };

  const handleReturnBook = async (issueId: string) => {
    const fine = prompt('Enter overdue fine amount if applicable (₹):', '0');
    try {
      await ApiService.returnLibraryBook(issueId, undefined, Number(fine) || 0);
      alert('✅ Book marked as returned and added back to available inventory!');
      loadData();
    } catch (err: any) {
      alert('Return failed: ' + err.message);
    }
  };

  const filteredBooks = books.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.isbn && b.isbn.toLowerCase().includes(q)) ||
      (b.subject && b.subject.toLowerCase().includes(q)) ||
      (b.rackNumber && b.rackNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen size={16} />
            <span>Learning Resources Center</span>
          </div>
          <h1 className="text-2xl font-black">Library & Knowledge Center</h1>
          <p className="text-xs text-amber-100 mt-1 max-w-xl">
            Manage comprehensive book catalogs, track ISBN copies, monitor shelf rack locations, and process student/faculty lending ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBookModal(true)}
            className="bg-white text-amber-900 hover:bg-amber-50 px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
          >
            <Plus size={16} />
            <span>Add New Book</span>
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
          >
            <Bookmark size={16} />
            <span>Issue Book</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'catalog'
              ? 'bg-amber-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={16} />
          <span>Book Catalog Inventory ({books.length})</span>
        </button>
        <button
          onClick={() => setSubTab('issues')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'issues'
              ? 'bg-amber-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw size={16} />
          <span>Active Book Loans ({issues.filter((i) => i.status === 'ISSUED').length} Active)</span>
        </button>
      </div>

      {/* ================= 1. BOOK CATALOG ================= */}
      {subTab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Search size={16} className="text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Search by title, author, subject, rack or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-medium focus:outline-none bg-transparent"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingBooks ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading books catalog...</div>
            ) : filteredBooks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No books matching search criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Book Title & Author</th>
                      <th className="py-3 px-4">ISBN</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Shelf / Rack</th>
                      <th className="py-3 px-4 text-center">Available / Total</th>
                      <th className="py-3 px-4 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredBooks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{b.title}</div>
                          <div className="text-[11px] text-slate-400">{b.author} {b.publisher ? `• ${b.publisher}` : ''}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {b.isbn || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">
                          {b.subject}
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-700">
                          {b.rackNumber}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${
                              b.availableCopies > 0
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {b.availableCopies} / {b.totalCopies}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          ₹{b.price || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 2. ISSUES & RETURNS ================= */}
      {subTab === 'issues' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loadingIssues ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading circulation ledger...</div>
          ) : issues.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No books currently on loan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Borrower</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Return Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {issues.map((iss) => (
                    <tr key={iss.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{iss.bookTitle}</div>
                        <div className="text-[11px] text-slate-400">{iss.bookAuthor}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{iss.borrowerName}</div>
                        <div className="text-[11px] text-slate-400">{iss.borrowerType} {iss.admissionNo ? `• ${iss.admissionNo}` : ''}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {iss.issueDate}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-700">
                        {iss.dueDate}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {iss.returnDate || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            iss.status === 'ISSUED'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {iss.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {iss.status === 'ISSUED' && (
                          <button
                            onClick={() => handleReturnBook(iss.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition text-[11px] shadow"
                          >
                            Return Book
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-amber-800 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">Add Book to Catalog</h3>
              <button onClick={() => setShowBookModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddBook} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Book Title *</label>
                <input required value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Author *</label>
                  <input required value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">ISBN Code</label>
                  <input value={bookIsbn} onChange={(e) => setBookIsbn(e.target.value)} placeholder="978-..." className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Subject / Category</label>
                  <input value={bookSubject} onChange={(e) => setBookSubject(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Shelf / Rack Number</label>
                  <input value={bookRack} onChange={(e) => setBookRack(e.target.value)} placeholder="e.g. Rack B2" className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Total Copies</label>
                  <input type="number" value={bookCopies} onChange={(e) => setBookCopies(Number(e.target.value))} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Price (₹)</label>
                  <input type="number" value={bookPrice} onChange={(e) => setBookPrice(Number(e.target.value))} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowBookModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-700 text-white rounded-xl font-bold shadow">Save to Catalog</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-amber-800 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">Issue Book to Member</h3>
              <button onClick={() => setShowIssueModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleIssueBook} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Select Book *</label>
                <select
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="">-- Choose Book --</option>
                  {books.filter((b) => b.availableCopies > 0).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.availableCopies} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Borrower Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setBorrowerType('student'); setSelectedBorrowerId(''); }}
                    className={`py-1.5 rounded-xl font-bold border ${borrowerType === 'student' ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBorrowerType('staff'); setSelectedBorrowerId(''); }}
                    className={`py-1.5 rounded-xl font-bold border ${borrowerType === 'staff' ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    Faculty / Staff
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Select {borrowerType === 'student' ? 'Student' : 'Staff Member'} *
                </label>
                <select
                  required
                  value={selectedBorrowerId}
                  onChange={(e) => setSelectedBorrowerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="">-- Choose Member --</option>
                  {borrowerType === 'student'
                    ? students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} (Adm: {s.admissionNo})
                        </option>
                      ))
                    : staffList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.role})
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Return Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowIssueModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-700 text-white rounded-xl font-bold shadow">Issue Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
