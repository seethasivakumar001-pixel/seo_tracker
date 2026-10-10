import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus, Mail, KeyRound, User, Trash2, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import toast from 'react-hot-toast';

const addUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export function Users() {
  const { user } = useAuthStore();
  const isPM = Boolean(user?.isPM || user?.role?.includes('PM') || user?.role?.includes('Project Manager') || user?.role?.includes('Admin'));

  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/users');
      if (!res.ok) throw new Error('Failed to load users from database');
      const data = await res.json();
      setUsersList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data) => {
    if (!isPM) {
      toast.error('Only Project Managers (PM) and Administrators can create users.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          password: data.password
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      toast.success(`User ${data.name} created successfully!`);
      reset();
      fetchUsers();
    } catch (err) {
      console.error('Create user error:', err);
      setErrorMsg(err.message || 'Failed to create user.');
      toast.error(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (userId === user?.id) {
      toast.error('You cannot delete your own logged-in account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete user');
      }
      toast.success(`User ${userName} deleted from database.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              User Management
            </h1>
            <Badge variant="primary" size="xs">
              PM & Admin Access
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create and manage team accounts stored in your database with assigned access roles.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form Card (PM Only) */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#0062ff]" />
                <span>Create New User</span>
              </CardTitle>
              <CardDescription>
                Enter user details to register a new team member
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {!isPM ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs">
                <p className="font-semibold">Restricted Access</p>
                <p className="mt-1">Only Project Managers (PM) and Administrators can create new user accounts.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0062ff] focus:ring-2 focus:ring-[#0062ff]/10"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mail ID (Email)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="e.g. user@syscorp.io"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0062ff] focus:ring-2 focus:ring-[#0062ff]/10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register('password')}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0062ff] focus:ring-2 focus:ring-[#0062ff]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer p-1 rounded-md transition"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#0062ff] hover:bg-[#004ecc] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-[#0062ff]/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Database Users Table Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle>Database User Accounts ({usersList.length})</CardTitle>
                <CardDescription>All registered users with active database credentials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <div className="w-6 h-6 border-2 border-[#0062ff]/30 border-t-[#0062ff] rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Loading database users...</p>
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No users found in database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                      <th className="pb-3 px-3">User</th>
                      <th className="pb-3 px-3">Email Address</th>
                      <th className="pb-3 px-3">Role / Access</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {usersList.map((u) => {
                      const isCurrentUser = u.id === user?.id;
                      const isUserPM = u.email.includes('pm') || u.email.includes('admin');
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
                                alt={u.name}
                                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                              />
                              <div className="truncate">
                                <span className="font-bold text-slate-900 dark:text-white block truncate">{u.name}</span>
                                {isCurrentUser && (
                                  <span className="text-[10px] text-[#0062ff] font-bold">You (Logged in)</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                            {u.email}
                          </td>
                          <td className="py-3 px-3">
                            {isUserPM ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0062ff]/10 text-[#0062ff] border border-[#0062ff]/20">
                                Project Manager (PM)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                Team Member
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isPM && !isCurrentUser && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
