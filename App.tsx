import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { analyzeReceipt } from './services/geminiService';
import type { InvestmentPlan, AIReceiptAnalysis, Transaction, User, UserInvestment, Notification } from './types';
import { TransactionStatus, TransactionType } from './types';
import { INVESTMENT_PLANS, ADMIN_PHONE, DEPOSIT_ENTITY, DEPOSIT_REFERENCE, WHATSAPP_SUPPORT_URL, WITHDRAWAL_FEE_PERCENTAGE, REFERRAL_WITHDRAWAL_DISCOUNT, MINIMUM_WITHDRAWAL_AMOUNT } from './constants';

// --- ICONS (SVG Components) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const InvestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const WithdrawIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const HelpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const WhatsappIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M16.6,14.2l-1.5-0.8c-0.3-0.1-0.5-0.1-0.7,0.1l-0.7,0.8c-0.2,0.3-0.6,0.4-0.9,0.2c-0.8-0.5-1.6-1.1-2.3-1.9 c-0.7-0.8-1.2-1.7-1.6-2.6c-0.1-0.3,0-0.6,0.2-0.8l0.6-0.7c0.2-0.2,0.2-0.5,0.1-0.7l-0.8-1.5c-0.1-0.3-0.4-0.5-0.7-0.5l-1.6,0 c-0.3,0-0.6,0.1-0.8,0.4c-0.2,0.3-0.5,0.9-0.5,1.5c0,1.5,0.6,2.9,1.7,4.2c1.7,2.1,4,3.3,6.5,3.3c0.7,0,1.3-0.1,1.8-0.4 c0.5-0.2,0.9-0.7,1-1.2l0-1.6C17.1,14.6,16.9,14.3,16.6,14.2z M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10c5.5,0,10-4.5,10-10S17.5,2,12,2z M12,21.5c-5.2,0-9.5-4.3-9.5-9.5S6.8,2.5,12,2.5s9.5,4.3,9.5,9.5S17.2,21.5,12,21.5z"></path></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const TransactionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a3 3 0 00-3-3H6a3 3 0 00-3 3v1a6 6 0 006 6z" /></svg>;
const DepositIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ProfitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 16v-1m0 1v.01M4 4h16v16H4V4z" /></svg>;
const CheckIcon = () => <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>;
const CheckIconSmall = () => <div className="bg-green-500 rounded-full p-1 mr-3"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>

const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
                body,
                icon: '/vite.svg',
            });
        });
    }
};

// Mock API using localStorage
const mockApi = {
    getUsers: (): Record<string, User> => JSON.parse(localStorage.getItem('users') || '{}'),
    saveUsers: (users: Record<string, User>) => localStorage.setItem('users', JSON.stringify(users)),
    getTransactions: (): Transaction[] => JSON.parse(localStorage.getItem('transactions') || '[]'),
    saveTransactions: (transactions: Transaction[]) => localStorage.setItem('transactions', JSON.stringify(transactions)),
    getUsedReceipts: (): string[] => JSON.parse(localStorage.getItem('usedReceipts') || '[]'),
    saveUsedReceipts: (receipts: string[]) => localStorage.setItem('usedReceipts', JSON.stringify(receipts)),
    getNotifications: (): Notification[] => JSON.parse(localStorage.getItem('notifications') || '[]'),
    saveNotifications: (notifications: Notification[]) => localStorage.setItem('notifications', JSON.stringify(notifications)),

    createNotification: (userId: string, message: string, type: 'success' | 'error'): Promise<Notification> => {
        return new Promise(resolve => {
            const notifications = mockApi.getNotifications();
            const newNotification: Notification = {
                id: `N${Date.now()}`,
                userId,
                message,
                type,
                read: false,
                date: new Date().toISOString(),
            };
            notifications.unshift(newNotification);
            mockApi.saveNotifications(notifications);
            
            if (document.hidden && userId !== ADMIN_PHONE) { // Avoid browser notifications for admin for now
                showBrowserNotification('Invest Angola', message);
            }

            resolve(newNotification);
        });
    },

    register: (phone: string, password: string, referralCode?: string): Promise<{ success: boolean; message: string }> => {
        return new Promise(resolve => {
            const users = mockApi.getUsers();
            if (users[phone]) {
                resolve({ success: false, message: 'Número de telefone já registado.' });
                return;
            }
            
            const newUser: User = {
                phone,
                passwordHash: password, // In a real app, hash this!
                balance: 0,
                investments: [],
                referralCode: `IA${Date.now()}${Math.floor(Math.random() * 100)}`,
                referredUsers: [],
            };

            if (referralCode) {
                const referrer = Object.values(users).find(u => u.referralCode === referralCode);
                if (referrer) {
                    newUser.referredBy = referrer.phone;
                    referrer.referredUsers.push(phone);
                }
            }
            
            users[phone] = newUser;
            mockApi.saveUsers(users);
            resolve({ success: true, message: 'Registo bem-sucedido!' });
        });
    },

    login: (phone: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
        return new Promise(resolve => {
            const users = mockApi.getUsers();
            const user = users[phone];
            if (!user || user.passwordHash !== password) {
                resolve({ success: false, message: 'Número de telefone ou senha inválida.' });
                return;
            }
            resolve({ success: true, message: 'Login bem-sucedido!', user });
        });
    },

    createTransaction: (transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction> => {
        return new Promise(resolve => {
            const transactions = mockApi.getTransactions();
            const newTransaction: Transaction = {
                ...transaction,
                id: `T${Date.now()}${Math.floor(Math.random() * 1000)}`,
                date: new Date().toISOString(),
            };
            transactions.unshift(newTransaction);
            mockApi.saveTransactions(transactions);
            resolve(newTransaction);
        });
    },
    
    updateTransactionStatus: (id: string, status: TransactionStatus): Promise<boolean> => {
        return new Promise(resolve => {
            const transactions = mockApi.getTransactions();
            const txIndex = transactions.findIndex(t => t.id === id);
            if (txIndex !== -1) {
                transactions[txIndex].status = status;
                mockApi.saveTransactions(transactions);

                if (status === TransactionStatus.Approved && transactions[txIndex].type === TransactionType.Withdrawal) {
                    // In a real app, this logic would be on the backend after approval
                    // For simulation, we assume admin approval triggers balance deduction
                }

                if (status === TransactionStatus.Approved && transactions[txIndex].type === TransactionType.Deposit) {
                   const users = mockApi.getUsers();
                   const user = users[transactions[txIndex].userId];
                   if (user) {
                       user.balance += transactions[txIndex].amount;
                       mockApi.saveUsers(users);
                   }
                }

                resolve(true);
            }
            resolve(false);
        });
    },

    invest: (userId: string, planId: number): Promise<{ success: boolean; message: string }> => {
        return new Promise(resolve => {
            const users = mockApi.getUsers();
            const user = users[userId];
            const plan = INVESTMENT_PLANS.find(p => p.id === planId);

            if (!user || !plan) {
                resolve({ success: false, message: 'Utilizador ou plano não encontrado.' });
                return;
            }
            if (user.balance < plan.amount) {
                resolve({ success: false, message: 'Saldo insuficiente.' });
                return;
            }

            user.balance -= plan.amount;
            user.investments.push({ planId, startDate: new Date().toISOString(), amount: plan.amount });
            mockApi.saveUsers(users);

            mockApi.createTransaction({
                userId,
                type: TransactionType.Investment,
                status: TransactionStatus.Approved,
                amount: plan.amount,
                details: { planName: plan.name },
            });
            
            if (user.referredBy) {
                const referrer = users[user.referredBy];
                if (referrer) {
                    // Logic for referral bonus can be added here
                }
            }

            mockApi.saveUsers(users);
            resolve({ success: true, message: `Investimento no ${plan.name} bem-sucedido!` });
        });
    },

    processDailyEarnings: (): void => {
        const users = mockApi.getUsers();
        let earningsAdded = false;
        Object.values(users).forEach(user => {
            user.investments.forEach(inv => {
                const plan = INVESTMENT_PLANS.find(p => p.id === inv.planId);
                const startDate = new Date(inv.startDate);
                const today = new Date();
                const diffTime = Math.abs(today.getTime() - startDate.getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (plan && diffDays < plan.durationDays) {
                    const lastEarningKey = `lastEarning_${user.phone}_${inv.planId}_${new Date(inv.startDate).getTime()}`;
                    const lastEarningDateStr = localStorage.getItem(lastEarningKey);
                    const todayStr = today.toISOString().split('T')[0];
                    if (lastEarningDateStr !== todayStr) {
                         user.balance += plan.dailyReturn;
                         earningsAdded = true;
                         mockApi.createTransaction({
                             userId: user.phone,
                             type: TransactionType.Earning,
                             status: TransactionStatus.Approved,
                             amount: plan.dailyReturn,
                             details: { planName: plan.name }
                         });
                         localStorage.setItem(lastEarningKey, todayStr);
                    }
                }
            });
        });

        if (earningsAdded) {
            mockApi.saveUsers(users);
        }
    }
};

type Page = 'login' | 'register' | 'dashboard' | 'invest' | 'deposit' | 'withdraw' | 'profile' | 'help' | 'admin' | 'transactions';

// --- Reusable Components (defined outside App to prevent re-creation) ---
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 ${className}`}>{children}</div>
);

const Button: React.FC<{ onClick?: () => void; children: React.ReactNode; className?: string; type?: 'button' | 'submit'; disabled?: boolean }> = ({ onClick, children, className, type = 'button', disabled }) => (
    <button type={type} onClick={onClick} disabled={disabled} className={`w-full text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-800'} ${className}`}>{children}</button>
);

const Input: React.FC<{ id: string; type: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean }> = (props) => (
    <input className="w-full px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none" {...props} />
);

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center text-primary dark:text-secondary font-semibold mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Voltar
    </button>
);

const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
        case TransactionStatus.Approved: return 'text-green-500';
        case TransactionStatus.Pending: return 'text-yellow-500';
        case TransactionStatus.Rejected: return 'text-red-500';
    }
};

// --- App Component and Pages ---
export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('login');
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [pendingWithdrawalCount, setPendingWithdrawalCount] = useState(0);


    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        // Set dark mode only if it's explicitly saved, otherwise default to light
        if (savedTheme === 'dark') {
            setIsDarkMode(true);
        } else {
            setIsDarkMode(false);
        }
    }, []);


    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);


    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        const loggedInUserPhone = sessionStorage.getItem('loggedInUser');
        if (loggedInUserPhone) {
            const users = mockApi.getUsers();
            const user = users[loggedInUserPhone];
            if (user) {
                mockApi.processDailyEarnings();
                const updatedUsers = mockApi.getUsers();
                setCurrentUser(updatedUsers[loggedInUserPhone]);
                setCurrentPage('dashboard');
            }
        }
        setLoading(false);
    }, []);
    
    const fetchNotifications = useCallback(() => {
        if (currentUser) {
            const allNotifications = mockApi.getNotifications();
            setNotifications(allNotifications.filter(n => n.userId === currentUser.phone));

            if(currentUser.phone === ADMIN_PHONE) {
                const allTx = mockApi.getTransactions();
                setPendingWithdrawalCount(allTx.filter(tx => tx.type === TransactionType.Withdrawal && tx.status === TransactionStatus.Pending).length);
            }
        }
    }, [currentUser]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000); // Poll for notifications
        return () => clearInterval(interval);
    }, [fetchNotifications]);
    
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const markNotificationsAsRead = () => {
        if (currentUser) {
            const allNotifications = mockApi.getNotifications();
            const updated = allNotifications.map(n => 
                n.userId === currentUser.phone ? { ...n, read: true } : n
            );
            mockApi.saveNotifications(updated);
            fetchNotifications();
        }
    };


    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUser');
        setCurrentUser(null);
        setCurrentPage('login');
        setNotifications([]);
    };

    const refreshUser = () => {
        if (currentUser) {
            const users = mockApi.getUsers();
            setCurrentUser(users[currentUser.phone]);
        }
    };

    const isAdmin = currentUser?.phone === ADMIN_PHONE;

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-dark"><div className="text-2xl font-bold text-primary">A carregar...</div></div>;
    }

    const renderPage = () => {
        if (!currentUser) {
            switch (currentPage) {
                case 'register':
                    return <RegisterPage setCurrentPage={setCurrentPage} showNotification={showNotification} />;
                default:
                    return <LoginPage setCurrentPage={setCurrentPage} setCurrentUser={setCurrentUser} showNotification={showNotification} />;
            }
        }

        const pages: Record<Page, React.ReactNode> = {
            dashboard: <DashboardPage user={currentUser} setCurrentPage={setCurrentPage} />,
            invest: <InvestPage user={currentUser} showNotification={showNotification} refreshUser={refreshUser} />,
            deposit: <DepositPage user={currentUser} showNotification={showNotification} refreshUser={refreshUser} setCurrentPage={setCurrentPage} />,
            withdraw: <WithdrawPage user={currentUser} showNotification={showNotification} refreshUser={refreshUser} setCurrentPage={setCurrentPage} />,
            profile: <ProfilePage user={currentUser} onLogout={handleLogout} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />,
            help: <HelpPage />,
            transactions: <TransactionsPage user={currentUser} />,
            admin: isAdmin ? <AdminPage showNotification={showNotification} /> : <DashboardPage user={currentUser} setCurrentPage={setCurrentPage} />,
            login: <></>,
            register: <></>,
        };

        return pages[currentPage];
    };
    
    const getPageTitle = (page: Page, user: User | null): string => {
        switch(page) {
            case 'dashboard': return `Olá, ${user?.phone}!`;
            case 'invest': return 'Planos de Investimento';
            case 'deposit': return 'Fazer Depósito';
            case 'withdraw': return 'Solicitar Saque';
            case 'profile': return 'Meu Perfil';
            case 'help': return 'Ajuda & Suporte';
            case 'transactions': return 'Histórico de Transações';
            case 'admin': return 'Painel de Admin';
            default: return 'Invest Angola';
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-dark text-gray-800 dark:text-gray-200 font-sans">
            <div className="container mx-auto max-w-lg p-0">
                {notification && (
                    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {notification.message}
                    </div>
                )}
                {currentUser && currentPage !== 'deposit' && currentPage !== 'withdraw' && <WhatsappBanner />}
                {currentUser && <Header title={getPageTitle(currentPage, currentUser)} unreadCount={unreadCount} onNotificationClick={() => setIsNotificationsPanelOpen(true)} />}

                <main className="pb-24 p-4">
                    {renderPage()}
                </main>
                
                {currentUser && isNotificationsPanelOpen && (
                    <NotificationsPanel 
                        notifications={notifications} 
                        onClose={() => setIsNotificationsPanelOpen(false)} 
                        onMarkAsRead={markNotificationsAsRead}
                    />
                )}

                {currentUser && <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} isAdmin={isAdmin} pendingWithdrawalCount={pendingWithdrawalCount} />}
            </div>
        </div>
    );
}

// --- Page Components ---

const LoginPage: React.FC<{ setCurrentPage: (page: Page) => void; setCurrentUser: (user: User) => void; showNotification: (msg: string, type: 'success' | 'error') => void; }> = ({ setCurrentPage, setCurrentUser, showNotification }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const res = await mockApi.login(phone, password);
        if (res.success && res.user) {
            sessionStorage.setItem('loggedInUser', res.user.phone);
            setCurrentUser(res.user);
            showNotification(res.message, 'success');
            setCurrentPage('dashboard');
        } else {
            showNotification(res.message, 'error');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
             <h1 className="text-4xl font-bold text-primary mb-2">Invest Angola</h1>
             <p className="text-gray-600 dark:text-gray-400 mb-8">Bem-vindo de volta!</p>
            <Card className="w-full">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input id="phone" type="tel" placeholder="Número de telefone" value={phone} onChange={e => setPhone(e.target.value)} required />
                    <Input id="password" type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
                    <Button type="submit" disabled={isLoading}>{isLoading ? 'A entrar...' : 'Entrar'}</Button>
                </form>
            </Card>
            <p className="mt-6 text-center">
                Não tem uma conta? <button onClick={() => setCurrentPage('register')} className="font-bold text-primary hover:underline">Registe-se</button>
            </p>
        </div>
    );
};

const RegisterPage: React.FC<{ setCurrentPage: (page: Page) => void; showNotification: (msg: string, type: 'success' | 'error') => void; }> = ({ setCurrentPage, showNotification }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode) {
            setReferralCode(refCode);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            showNotification('As senhas não coincidem.', 'error');
            return;
        }
        setIsLoading(true);
        const res = await mockApi.register(phone, password, referralCode);
        showNotification(res.message, res.success ? 'success' : 'error');
        if (res.success) {
            setCurrentPage('login');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-4xl font-bold text-primary mb-2">Criar Conta</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Junte-se à Invest Angola hoje!</p>
            <Card className="w-full">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input id="phone" type="tel" placeholder="Número de telefone" value={phone} onChange={e => setPhone(e.target.value)} required />
                    <Input id="password" type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
                    <Input id="confirmPassword" type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    <Input id="referralCode" type="text" placeholder="Código de Convite (Opcional)" value={referralCode} onChange={e => setReferralCode(e.target.value)} />
                    <Button type="submit" disabled={isLoading}>{isLoading ? 'A registar...' : 'Registar'}</Button>
                </form>
            </Card>
            <p className="mt-6 text-center">
                Já tem uma conta? <button onClick={() => setCurrentPage('login')} className="font-bold text-primary hover:underline">Entrar</button>
            </p>
        </div>
    );
};

const CommunityProofSnippet: React.FC = () => (
    <Card className="bg-gradient-to-r from-green-400 to-teal-500 text-white !p-4">
         <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-full mr-4">
                <WhatsappIcon />
            </div>
            <div>
                <h3 className="font-bold text-lg">Faça Parte da Comunidade!</h3>
                <p className="text-sm mt-1 opacity-90">
                    Junte-se ao nosso grupo no WhatsApp para ver provas de pagamento, tirar dúvidas e conectar-se com outros investidores que já estão a lucrar de verdade. Não fique de fora!
                </p>
                 <a href={WHATSAPP_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 bg-white text-green-600 font-bold py-2 px-4 rounded-lg text-sm hover:bg-gray-100 transition shadow-md">
                    Entrar no Grupo Agora
                </a>
            </div>
        </div>
    </Card>
);

const DashboardPage: React.FC<{ user: User; setCurrentPage: (page: Page) => void }> = ({ user, setCurrentPage }) => {
    const totalInvested = user.investments.reduce((sum, inv) => sum + inv.amount, 0);
    const dailyEarnings = user.investments.reduce((sum, inv) => {
        const plan = INVESTMENT_PLANS.find(p => p.id === inv.planId);
        const startDate = new Date(inv.startDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - startDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return (plan && diffDays < plan.durationDays) ? sum + (plan?.dailyReturn || 0) : sum;
    }, 0);
    
    const totalEarnings = mockApi.getTransactions()
        .filter(tx => tx.userId === user.phone && tx.type === TransactionType.Earning)
        .reduce((sum, tx) => sum + tx.amount, 0);
    
    const QuickActionCard: React.FC<{ title: string; onClick: () => void; icon: React.ReactNode; }> = ({ title, onClick, icon }) => (
        <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all space-y-2">
            {icon}
            <span className="font-semibold text-sm">{title}</span>
        </button>
    );

    return (
        <div className="space-y-6">
            <Card className="text-center bg-gradient-to-br from-primary to-blue-800 text-white">
                <h2 className="text-lg font-semibold opacity-80">Saldo Disponível</h2>
                <p className="text-4xl font-bold tracking-tight">{user.balance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                <div className="flex gap-4 mt-4">
                    <button onClick={() => setCurrentPage('deposit')} className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg">Depositar</button>
                    <button onClick={() => setCurrentPage('withdraw')} className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg">Sacar</button>
                </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <Card>
                    <h3 className="font-semibold text-gray-500 text-sm">Total Investido</h3>
                    <p className="text-xl font-bold text-green-500">{totalInvested.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </Card>
                <Card>
                    <h3 className="font-semibold text-gray-500 text-sm">Ganhos Totais</h3>
                    <p className="text-xl font-bold text-indigo-500">{totalEarnings.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </Card>
                <Card>
                    <h3 className="font-semibold text-gray-500 text-sm">Ganhos Diários</h3>
                    <p className="text-xl font-bold text-blue-500">{dailyEarnings.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </Card>
                <Card>
                    <h3 className="font-semibold text-gray-500 text-sm">Convidados</h3>
                    <p className="text-xl font-bold text-purple-500">{user.referredUsers.length}</p>
                </Card>
            </div>
            
            <ActiveInvestments investments={user.investments} />

            <Card>
                <h2 className="text-xl font-bold mb-4">Acesso Rápido</h2>
                <div className="grid grid-cols-2 gap-4">
                    <QuickActionCard title="Investir Agora" onClick={() => setCurrentPage('invest')} icon={<InvestIcon />} />
                    <QuickActionCard title="Ver Transações" onClick={() => setCurrentPage('transactions')} icon={<TransactionsIcon />} />
                    <QuickActionCard title="Convidar Amigos" onClick={() => setCurrentPage('profile')} icon={<UsersIcon />} />
                    <QuickActionCard title="Ajuda & Suporte" onClick={() => setCurrentPage('help')} icon={<HelpIcon />} />
                </div>
            </Card>

            <CommunityProofSnippet />

            <InfoSnippet />

            <RecentTransactions userId={user.phone} />
        </div>
    );
};

const ActiveInvestments: React.FC<{investments: UserInvestment[]}> = ({investments}) => {
    if (investments.length === 0) return null;

    return (
        <Card>
            <h2 className="text-xl font-bold mb-4">Meus Investimentos Ativos</h2>
            <div className="space-y-4">
                {investments.map((inv, index) => {
                    const plan = INVESTMENT_PLANS.find(p => p.id === inv.planId);
                    if (!plan) return null;
                    const startDate = new Date(inv.startDate);
                    const today = new Date();
                    const diffTime = Math.abs(today.getTime() - startDate.getTime());
                    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const progress = Math.min(100, (daysPassed / plan.durationDays) * 100);

                    return (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold">{plan.name}</span>
                                <span className="text-green-500 font-semibold">+{plan.dailyReturn.toLocaleString('pt-AO', {style: 'currency', currency: 'AOA'})}/dia</span>
                            </div>
                             <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs mt-1 text-gray-500">
                                <span>{inv.amount.toLocaleString('pt-AO', {style: 'currency', currency: 'AOA'})}</span>
                                <span>{daysPassed} / {plan.durationDays} dias</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const InfoSnippet: React.FC = () => (
    <Card className="bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-400">
        <div className="flex items-start">
            <HelpIcon />
            <div>
                <h3 className="font-bold">Dica Rápida: Como funcionam os saques?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Os saques são processados manualmente pela nossa equipa para garantir a segurança, das 08:00 às 18:00 (Seg-Sex). O valor mínimo é de 2.000 Kz.
                </p>
            </div>
        </div>
    </Card>
);


const RecentTransactions: React.FC<{userId: string}> = ({userId}) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const allTransactions = mockApi.getTransactions();
        setTransactions(allTransactions.filter(t => t.userId === userId).slice(0, 5));
    }, [userId]);
    
    const getTransactionIcon = (type: TransactionType) => {
        switch(type) {
            case TransactionType.Deposit: return <div className="bg-blue-100 dark:bg-blue-900 text-blue-500 p-2 rounded-full">+</div>;
            case TransactionType.Withdrawal: return <div className="bg-red-100 dark:bg-red-900 text-red-500 p-2 rounded-full">-</div>;
            case TransactionType.Earning: return <div className="bg-green-100 dark:bg-green-900 text-green-500 p-2 rounded-full">$</div>;
            case TransactionType.Investment: return <div className="bg-purple-100 dark:bg-purple-900 text-purple-500 p-2 rounded-full">I</div>;
        }
    }

    return (
        <Card>
            <h2 className="text-xl font-bold mb-4">Transações Recentes</h2>
            {transactions.length > 0 ? (
                <ul className="space-y-4">
                    {transactions.map(tx => (
                        <li key={tx.id} className="flex items-center gap-4">
                            {getTransactionIcon(tx.type)}
                            <div className="flex-grow">
                                <p className="font-semibold">{tx.type}</p>
                                <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString('pt-AO')}</p>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold text-lg ${tx.type === TransactionType.Deposit || tx.type === TransactionType.Earning ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.type === TransactionType.Deposit || tx.type === TransactionType.Earning ? '+' : '-'} {tx.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                </p>
                                <p className={`text-sm font-semibold ${getStatusColor(tx.status)}`}>{tx.status}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500">Nenhuma transação ainda.</p>
            )}
        </Card>
    );
}

const TransactionsPage: React.FC<{ user: User }> = ({ user }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const allTransactions = mockApi.getTransactions();
        setTransactions(allTransactions.filter(t => t.userId === user.phone));
    }, [user.phone]);
    
    return (
        <div className="space-y-4">
             <Card>
                <h2 className="text-xl font-bold mb-4">Todas as Transações</h2>
                {transactions.length > 0 ? (
                    <ul className="space-y-4">
                        {transactions.map(tx => (
                            <li key={tx.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{tx.type}</p>
                                    <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleString('pt-AO')}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-lg ${tx.type === TransactionType.Deposit || tx.type === TransactionType.Earning ? 'text-green-500' : 'text-red-500'}`}>
                                        {tx.type === TransactionType.Deposit || tx.type === TransactionType.Earning ? '+' : '-'} {tx.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                    </p>
                                    <p className={`text-sm font-semibold ${getStatusColor(tx.status)}`}>{tx.status}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500">Nenhuma transação encontrada.</p>
                )}
            </Card>
        </div>
    );
};


const InvestPage: React.FC<{ user: User; showNotification: (msg: string, type: 'success' | 'error') => void; refreshUser: () => void }> = ({ user, showNotification, refreshUser }) => {
    
    const handleInvest = async (plan: InvestmentPlan) => {
        if (user.balance < plan.amount) {
            showNotification('Saldo insuficiente para este plano.', 'error');
            return;
        }
        if (window.confirm(`Tem a certeza que deseja investir ${plan.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} no ${plan.name}?`)) {
            const res = await mockApi.invest(user.phone, plan.id);
            showNotification(res.message, res.success ? 'success' : 'error');
            if (res.success) {
                refreshUser();
            }
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Escolha Seu Plano</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Investimentos com rendimentos diários garantidos por 30 dias</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {INVESTMENT_PLANS.map(plan => (
                    <Card key={plan.id} className="flex flex-col relative overflow-hidden !p-4">
                        {plan.isPopular && (
                            <div className="absolute top-3 right-[-40px] bg-yellow-400 text-gray-800 text-xs font-bold px-10 py-1 transform rotate-45">
                                Popular
                            </div>
                        )}
                        <h2 className="text-xl font-bold">{plan.name}</h2>
                        <p className="text-sm text-gray-500 mb-4">Rendimento garantido por 30 dias</p>

                        <div className="bg-blue-50 dark:bg-blue-900/50 text-center rounded-lg py-4 mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Investimento</p>
                            <p className="text-3xl font-bold text-primary">{plan.amount.toLocaleString('pt-AO')} Kz</p>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Rendimento Diário</span><span className="font-semibold">{plan.dailyReturn.toLocaleString('pt-AO')} Kz</span></div>
                            <div className="flex justify-between"><span>Duração</span><span className="font-semibold">{plan.durationDays} dias</span></div>
                            <div className="flex justify-between border-t dark:border-gray-700 pt-2 mt-2 font-bold"><span>Retorno Total</span><span className="text-green-500">{plan.totalReturn.toLocaleString('pt-AO')} Kz</span></div>
                        </div>

                        <ul className="my-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <li className="flex items-center"><CheckIcon />Rendimentos creditados diariamente</li>
                            <li className="flex items-center"><CheckIcon />Saque disponível de segunda a sexta</li>
                            <li className="flex items-center"><CheckIcon />Processamento automático em 30 minutos</li>
                        </ul>

                        <Button onClick={() => handleInvest(plan)} className="mt-auto bg-gray-800 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600">
                            Investir Agora
                        </Button>
                    </Card>
                ))}
            </div>

            <Card>
                <h2 className="text-2xl font-bold mb-4">Como Funciona?</h2>
                <ul className="space-y-3">
                    <li className="flex items-center"><CheckIconSmall />Escolha um plano de investimento</li>
                    <li className="flex items-center"><CheckIconSmall />Faça o depósito e envie o comprovativo</li>
                    <li className="flex items-center"><CheckIconSmall />Aguarde aprovação automática (até 2 minutos)</li>
                    <li className="flex items-center"><CheckIconSmall />Receba rendimentos diários automaticamente por 30 dias</li>
                    <li className="flex items-center"><CheckIconSmall />Saque seus lucros quando quiser (segunda a sexta)</li>
                </ul>
            </Card>
        </div>
    );
};

const DepositPage: React.FC<{ user: User; showNotification: (msg: string, type: 'success' | 'error') => void; refreshUser: () => void, setCurrentPage: (page: Page) => void; }> = ({ user, showNotification, refreshUser, setCurrentPage }) => {
    const [receipt, setReceipt] = useState<File | null>(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReceipt(e.target.files[0]);
        }
    };

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (!receipt) {
            showNotification('Por favor, selecione um comprovativo.', 'error');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            showNotification('Por favor, insira um valor de depósito válido.', 'error');
            return;
        }


        setIsLoading(true);

        const transactionIdFromImage = `${receipt.name}-${receipt.size}`;
        const usedReceipts = mockApi.getUsedReceipts();
        if (usedReceipts.includes(transactionIdFromImage)) {
            const reason = 'Este comprovativo já foi usado.';
            showNotification(reason, 'error');
            await mockApi.createNotification(user.phone, `Depósito falhou: ${reason}`, 'error');
            setIsLoading(false);
            return;
        }

        const result = await analyzeReceipt(receipt, amount);
        
        if (result.isValid) {
            await mockApi.createTransaction({
                userId: user.phone,
                type: TransactionType.Deposit,
                status: TransactionStatus.Approved,
                amount: amount,
                details: { ...result.extractedData, fileName: receipt.name }
            });
            
            usedReceipts.push(transactionIdFromImage);
            mockApi.saveUsedReceipts(usedReceipts);
            
            const successMsg = `Depósito de ${amount.toLocaleString('pt-AO', {style: 'currency', currency: 'AOA'})} aprovado!`;
            showNotification('Depósito aprovado e saldo atualizado!', 'success');
            await mockApi.createNotification(user.phone, successMsg, 'success');
            refreshUser();
            setReceipt(null);
            setDepositAmount('');
        } else {
            const reason = result.rejectionReason || "Análise da IA falhou.";
            showNotification(`Depósito rejeitado: ${reason}`, 'error');
            await mockApi.createNotification(user.phone, `Seu depósito foi rejeitado: ${reason}`, 'error');
        }
        
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <BackButton onClick={() => setCurrentPage('dashboard')} />
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border-l-4 border-blue-400">
                <h2 className="text-lg font-bold mb-2">Instruções de Depósito</h2>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Entidade: <span className="font-semibold">{DEPOSIT_ENTITY}</span></li>
                    <li>Referência: <span className="font-semibold">{DEPOSIT_REFERENCE}</span></li>
                    <li>Após fazer o depósito, envie o comprovativo abaixo</li>
                    <li>A IA analisará automaticamente em até 2 minutos</li>
                </ul>
            </div>

            <Card>
                <h2 className="text-lg font-bold mb-1">Enviar Comprovativo</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Preencha os dados e envie o comprovativo do depósito</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Depositado (Kz)</label>
                        <Input id="depositAmount" type="number" placeholder="Ex: 5000" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comprovativo de Depósito</label>
                        <label htmlFor="receipt-upload" className="w-full flex flex-col items-center justify-center px-4 py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                           <UploadIcon />
                            <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">{receipt ? receipt.name : 'Clique para enviar o comprovativo'}</span>
                             <p className="text-xs text-gray-500">PNG, JPG ou PDF até 5MB</p>
                            <input id="receipt-upload" type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>
                
                <Button onClick={handleDeposit} disabled={isLoading || !receipt || !depositAmount} className="mt-6 bg-gray-800 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600">
                    {isLoading ? 'A analisar...' : 'Enviar Comprovativo'}
                </Button>
            </Card>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg border-l-4 border-yellow-400">
                <h2 className="text-lg font-bold mb-2">⚠️ Importante</h2>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Certifique-se de que o comprovativo está legível</li>
                    <li>O comprovativo não pode ter sido usado anteriormente</li>
                    <li>A análise por IA é automática e leva até 2 minutos</li>
                    <li>Após aprovação, o saldo será creditado imediatamente</li>
                </ul>
            </div>
        </div>
    );
};

const WithdrawPage: React.FC<{ user: User; showNotification: (msg: string, type: 'success' | 'error') => void; refreshUser: () => void, setCurrentPage: (page: Page) => void; }> = ({ user, showNotification, refreshUser, setCurrentPage }) => {
    const [method, setMethod] = useState<'paypay' | 'multicaixa'>('paypay');
    const [amount, setAmount] = useState('');
    const [paypalName, setPaypalName] = useState('');
    const [paypalNumber, setPaypalNumber] = useState('');
    const [iban, setIban] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const hasReferredUserWithInvestment = useMemo(() => {
        const allUsers = mockApi.getUsers();
        return user.referredUsers.some(phone => {
            const referredUser = allUsers[phone];
            return referredUser && referredUser.investments.length > 0;
        });
    }, [user.referredUsers]);

    const feePercentage = hasReferredUserWithInvestment ? WITHDRAWAL_FEE_PERCENTAGE - REFERRAL_WITHDRAWAL_DISCOUNT : WITHDRAWAL_FEE_PERCENTAGE;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // Sunday = 0, Monday = 1, etc.
    const isWeekday = currentDay >= 1 && currentDay <= 5; // Monday to Friday
    const isWithinWithdrawalHours = currentHour >= 8 && currentHour < 18;
    const canWithdraw = isWeekday && isWithinWithdrawalHours;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            showNotification('Por favor, insira um valor válido.', 'error');
            return;
        }
        if (numAmount < MINIMUM_WITHDRAWAL_AMOUNT) {
             showNotification(`O valor mínimo para saque é de ${MINIMUM_WITHDRAWAL_AMOUNT.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}.`, 'error');
            return;
        }
        if (numAmount > user.balance) {
            showNotification('Saldo insuficiente.', 'error');
            return;
        }
        if (!canWithdraw) {
            showNotification('Os saques só podem ser solicitados em dias úteis, entre as 08:00 e as 18:00.', 'error');
            return;
        }

        setIsLoading(true);
        const details = method === 'paypay' ? { method: 'PayPay AO', name: paypalName, phone: paypalNumber } : { method: 'Multicaixa Express', iban, accountHolder };

        await mockApi.createTransaction({
            userId: user.phone,
            type: TransactionType.Withdrawal,
            status: TransactionStatus.Pending,
            amount: numAmount,
            details,
        });

        await mockApi.createNotification(
            ADMIN_PHONE,
            `Novo pedido de saque de ${user.phone} (${numAmount.toLocaleString('pt-AO', {style: 'currency', currency: 'AOA'})}).`,
            'success'
        );

        const users = mockApi.getUsers();
        const currentUser = users[user.phone];
        currentUser.balance -= numAmount;
        mockApi.saveUsers(users);

        showNotification('Pedido de saque enviado! Será processado em breve.', 'success');
        refreshUser();
        setAmount('');
        setPaypalName('');
        setPaypalNumber('');
        setIban('');
        setAccountHolder('');
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <BackButton onClick={() => setCurrentPage('dashboard')} />
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border-l-4 border-blue-400 text-sm">
                <h2 className="text-lg font-bold mb-2">Informações Importantes</h2>
                 <ul className="list-disc list-inside space-y-1">
                    <li>Saques disponíveis das 08:00h de segunda a sexta-feira</li>
                    <li>Processamento automático em até 30 minutos</li>
                    <li>Taxa de saque: <span className="font-bold">{(feePercentage * 100).toFixed(0)}% do valor</span> {hasReferredUserWithInvestment && <span className="text-green-600">(desconto aplicado!)</span>}</li>
                    <li>Saldo disponível: <span className="font-bold">{user.balance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span></li>
                 </ul>
            </div>
            
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-lg font-bold mb-1">Escolha o Método de Saque</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Preencha os dados conforme o método escolhido</p>
                    
                    <div>
                         <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor do Saque (Kz)</label>
                        <Input id="amount" type="number" placeholder="Ex: 10000" value={amount} onChange={e => setAmount(e.target.value)} required />
                    </div>

                    <div className="flex mt-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                        <button type="button" onClick={() => setMethod('paypay')} className={`w-1/2 p-2 font-bold rounded-md transition-colors ${method === 'paypay' ? 'bg-white dark:bg-gray-800 text-primary shadow' : 'text-gray-600 dark:text-gray-300'}`}>PayPay AO</button>
                        <button type="button" onClick={() => setMethod('multicaixa')} className={`w-1/2 p-2 font-bold rounded-md transition-colors ${method === 'multicaixa' ? 'bg-white dark:bg-gray-800 text-primary shadow' : 'text-gray-600 dark:text-gray-300'}`}>Multicaixa Express</button>
                    </div>

                    {method === 'paypay' ? (
                        <>
                             <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-sm">
                                <h3 className="font-bold mb-2">Como sacar via PayPay AO</h3>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Verifique se a sua conta PayPay AO ativa</li>
                                    <li>Preencha seu nome completo</li>
                                    <li>Preencha o número de telefone associado à conta</li>
                                    <li>Aguarde a aprovação (até 30 minutos)</li>
                                </ol>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                                <Input id="paypalName" type="text" placeholder="Seu nome completo" value={paypalName} onChange={e => setPaypalName(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número PayPay AO</label>
                                <Input id="paypalNumber" type="tel" placeholder="+244 XXX XXX XXX" value={paypalNumber} onChange={e => setPaypalNumber(e.target.value)} required />
                            </div>
                        </>
                    ) : (
                        <>
                             <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-sm">
                                <h3 className="font-bold mb-2">Como sacar via Multicaixa Express</h3>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Certifique-se que o IBAN está correto</li>
                                    <li>O nome do titular deve corresponder ao da conta</li>
                                    <li>Verifique os dados antes de submeter</li>
                                    <li>Aguarde a aprovação (até 30 minutos)</li>
                                </ol>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Titular da Conta</label>
                                <Input id="accountHolder" type="text" placeholder="Nome completo do titular" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IBAN</label>
                                <Input id="iban" type="text" placeholder="AO06..." value={iban} onChange={e => setIban(e.target.value)} required />
                            </div>
                        </>
                    )}
                    <Button type="submit" disabled={isLoading || !canWithdraw} className="bg-gray-800 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 !mt-6">
                        {isLoading ? 'A processar...' : `Solicitar Saque via ${method === 'paypay' ? 'PayPay AO' : 'Multicaixa Express'}`}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

const ProfilePage: React.FC<{ user: User; onLogout: () => void; isDarkMode: boolean; toggleDarkMode: () => void; }> = ({ user, onLogout, isDarkMode, toggleDarkMode }) => {
    const [copied, setCopied] = useState(false);
    
    const referralLink = `${window.location.origin}${window.location.pathname}?ref=${user.referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    return (
        <div className="space-y-6">
            <Card className="text-center">
                <ProfileIcon />
                <p className="font-bold text-xl mt-2">{user.phone}</p>
            </Card>

             <Card>
                <h2 className="text-xl font-bold mb-4">Preferências</h2>
                <div className="flex justify-between items-center">
                    <span className="font-semibold">Modo Escuro</span>
                    <label htmlFor="darkModeToggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="darkModeToggle" className="sr-only peer" checked={isDarkMode} onChange={toggleDarkMode} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                </div>
            </Card>
            
            <Card>
                <h2 className="text-xl font-bold mb-2">Programa de Convite</h2>
                <p className="mb-4 text-sm">Convide um amigo com seu link. Se ele se registar e investir, você ganha <span className="font-bold">5% de desconto</span> na taxa de todos os seus saques futuros!</p>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500">Seu Link de Convite</p>
                    <div className="flex items-center justify-between mt-1">
                        <p className="font-mono text-primary dark:text-secondary truncate">{referralLink}</p>
                        <button onClick={handleCopy} className="ml-4 px-3 py-1 text-sm bg-primary text-white rounded">{copied ? 'Copiado!' : 'Copiar'}</button>
                    </div>
                </div>
            </Card>
            
            <Card>
                <h2 className="text-xl font-bold mb-2">Amigos Convidados</h2>
                {user.referredUsers.length > 0 ? (
                    <ul>{user.referredUsers.map(phone => <li key={phone}>{phone}</li>)}</ul>
                ) : <p className="text-gray-500">Ainda não convidou ninguém.</p>}
            </Card>
            
            <Button onClick={onLogout} className="bg-accent hover:bg-red-700">Terminar Sessão</Button>
        </div>
    );
};

const HelpPage: React.FC = () => {
    const faqs = [
        { q: 'Como faço um saque?', a: 'Vá para a página de "Sacar", escolha o método (PayPay AO ou Multicaixa Express), preencha os detalhes e o valor, e submeta o pedido. Os saques são processados em até 30 minutos durante o horário comercial (Seg-Sex, 08:00-18:00).' },
        { q: 'Qual é o valor mínimo de saque?', a: `O valor mínimo para solicitar um saque é de ${MINIMUM_WITHDRAWAL_AMOUNT.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}.` },
        { q: 'Qual é a taxa de saque?', a: 'A taxa padrão é de 20%. No entanto, se você convidar um amigo através do seu link e ele fizer um investimento, a sua taxa de saque é reduzida para 15% em todos os saques futuros.' },
        { q: 'Como funciona a verificação de depósito?', a: 'Usamos Inteligência Artificial para analisar seu comprovativo de depósito. Ela verifica a Entidade, Referência e o valor. Se tudo estiver correto e o comprovativo for único, seu saldo é atualizado automaticamente em menos de 2 minutos.' },
        { q: 'O que é a Invest Angola?', a: 'Somos uma plataforma de investimentos desenhada para o mercado angolano, oferecendo planos com rendimentos diários fixos para ajudar a crescer o seu capital de forma segura e transparente.' }
    ];

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold mb-2">Porquê Escolher a Invest Angola?</h2>
                <p>Oferecemos uma plataforma segura, com tecnologia de ponta (IA para depósitos), retornos competitivos e um sistema de suporte dedicado. Nosso foco é o investidor angolano, com métodos de pagamento locais e um modelo de negócio transparente.</p>
            </Card>
            
            <Card>
                <h2 className="text-xl font-bold mb-2">Perguntas Frequentes (FAQ)</h2>
                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i}>
                            <h3 className="font-semibold">{faq.q}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

// --- Admin Sub-components ---
const AdminDashboard: React.FC = () => {
    const users = mockApi.getUsers();
    const transactions = mockApi.getTransactions();
    
    const stats = useMemo(() => {
        const allUsers = Object.values(users);
        const totalUsers = allUsers.length;
        const totalInvested = allUsers.reduce((sum, u) => sum + u.investments.reduce((invSum, inv) => invSum + inv.amount, 0), 0);
        const totalBalance = allUsers.reduce((sum, u) => sum + u.balance, 0);
        
        const approvedDeposits = transactions.filter(t => t.type === TransactionType.Deposit && t.status === TransactionStatus.Approved);
        const approvedWithdrawals = transactions.filter(t => t.type === TransactionType.Withdrawal && t.status === TransactionStatus.Approved);

        const totalDeposits = approvedDeposits.reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawals = approvedWithdrawals.reduce((sum, t) => sum + t.amount, 0);
        const totalProfit = approvedWithdrawals.reduce((sum, t) => sum + (t.amount * WITHDRAWAL_FEE_PERCENTAGE), 0);

        return { totalUsers, totalInvested, totalBalance, totalDeposits, totalWithdrawals, totalProfit };
    }, [users, transactions]);

    const StatCard: React.FC<{title: string; value: string | number; icon: React.ReactNode}> = ({ title, value, icon }) => (
         <Card className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 mr-4">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-semibold">{typeof value === 'number' ? value.toLocaleString('pt-AO') : value}</p>
            </div>
        </Card>
    );

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Visão Geral da Plataforma</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="Total de Utilizadores" value={stats.totalUsers} icon={<UsersIcon />} />
                <StatCard title="Total em Saldos" value={stats.totalBalance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} icon={<ChartBarIcon />} />
                <StatCard title="Total Investido Ativo" value={stats.totalInvested.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} icon={<InvestIcon />} />
                <StatCard title="Total Depositado" value={stats.totalDeposits.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} icon={<DepositIcon />} />
                <StatCard title="Total Sacado" value={stats.totalWithdrawals.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} icon={<WithdrawIcon />} />
                <StatCard title="Lucro da Plataforma" value={stats.totalProfit.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} icon={<ProfitIcon />} />
            </div>
        </div>
    );
};

const AdminUsers: React.FC<{showNotification: (msg: string, type: 'success' | 'error') => void;}> = ({ showNotification }) => {
    const [users, setUsers] = useState(Object.values(mockApi.getUsers()));

    const handleEditBalance = (phone: string) => {
        const currentBalance = users.find(u => u.phone === phone)?.balance || 0;
        const newBalanceStr = prompt(`Novo saldo para ${phone}:`, currentBalance.toString());
        if (newBalanceStr) {
            const newBalance = parseFloat(newBalanceStr);
            if (!isNaN(newBalance)) {
                const allUsers = mockApi.getUsers();
                if (allUsers[phone]) {
                    allUsers[phone].balance = newBalance;
                    mockApi.saveUsers(allUsers);
                    setUsers(Object.values(allUsers));
                    showNotification('Saldo atualizado!', 'success');
                }
            } else {
                showNotification('Valor inválido.', 'error');
            }
        }
    };

    return (
         <Card>
            <h2 className="text-xl font-bold mb-4">Gerir Utilizadores</h2>
             <div className="space-y-4">
                {users.map(user => (
                    <div key={user.phone} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p><strong>Telefone:</strong> {user.phone}</p>
                        <p><strong>Saldo:</strong> {user.balance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                        <p><strong>Investimentos:</strong> {user.investments.length}</p>
                        <button onClick={() => handleEditBalance(user.phone)} className="mt-2 text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Editar Saldo</button>
                    </div>
                ))}
             </div>
        </Card>
    );
};

const AdminTransactions: React.FC = () => {
    const transactions = useMemo(() => mockApi.getTransactions(), []);
    return (
        <Card>
            <h2 className="text-xl font-bold mb-4">Histórico Global de Transações</h2>
            {transactions.length > 0 ? (
                <ul className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {transactions.map(tx => (
                        <li key={tx.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-center text-sm">
                            <div>
                                <p className="font-semibold">{tx.type} <span className="text-xs text-gray-500">({tx.userId})</span></p>
                                <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleString('pt-AO')}</p>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold ${tx.type === TransactionType.Deposit || tx.type === TransactionType.Earning ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                </p>
                                <p className={`text-xs font-semibold ${getStatusColor(tx.status)}`}>{tx.status}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500">Nenhuma transação encontrada.</p>
            )}
        </Card>
    );
};

const AdminWithdrawals: React.FC<{ showNotification: (msg: string, type: 'success' | 'error') => void; }> = ({ showNotification }) => {
    const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]);

    const fetchPending = useCallback(() => {
        const allTx = mockApi.getTransactions();
        setPendingWithdrawals(allTx.filter(tx => tx.type === TransactionType.Withdrawal && tx.status === TransactionStatus.Pending));
    }, []);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    const handleAction = async (txId: string, action: 'approve' | 'reject') => {
        const status = action === 'approve' ? TransactionStatus.Approved : TransactionStatus.Rejected;
        const tx = pendingWithdrawals.find(t => t.id === txId);
        
        await mockApi.updateTransactionStatus(txId, status);
        
        if(tx) {
             const amountFormatted = tx.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
             const message = action === 'approve' 
                ? `Seu saque de ${amountFormatted} foi aprovado.`
                : `Seu saque de ${amountFormatted} foi rejeitado.`;
             const type = action === 'approve' ? 'success' : 'error';
             await mockApi.createNotification(tx.userId, message, type);

            if(action === 'reject') {
                const users = mockApi.getUsers();
                const user = users[tx.userId];
                if (user) {
                    user.balance += tx.amount; // Refund balance
                    mockApi.saveUsers(users);
                }
            }
        }

        showNotification(`Saque ${status.toLowerCase()}!`, 'success');
        fetchPending();
    };

    return (
        <Card>
            <h2 className="text-xl font-bold mb-4">Pedidos de Saque Pendentes</h2>
            {pendingWithdrawals.length > 0 ? (
                <ul className="space-y-4">
                    {pendingWithdrawals.map(tx => (
                        <li key={tx.id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p><span className="font-semibold">Utilizador:</span> {tx.userId}</p>
                            <p><span className="font-semibold">Valor:</span> {tx.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                            <p><span className="font-semibold">Método:</span> {tx.details.method}</p>
                            {tx.details.method === 'PayPay AO' && <p> <span className="font-semibold">Info:</span> {tx.details.name} - {tx.details.phone}</p>}
                            {tx.details.method === 'Multicaixa Express' && <p> <span className="font-semibold">Info:</span> {tx.details.accountHolder} - {tx.details.iban}</p>}
                            <div className="flex gap-4 mt-3">
                                <button onClick={() => handleAction(tx.id, 'approve')} className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">Aprovar</button>
                                <button onClick={() => handleAction(tx.id, 'reject')} className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600">Rejeitar</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500">Nenhum pedido pendente.</p>
            )}
        </Card>
    );
};

const AdminPage: React.FC<{ showNotification: (msg: string, type: 'success' | 'error') => void; }> = ({ showNotification }) => {
    type AdminView = 'dashboard' | 'withdrawals' | 'users' | 'transactions';
    const [view, setView] = useState<AdminView>('dashboard');

    const AdminNav = () => (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-200 dark:bg-gray-700 p-2 rounded-lg mb-6">
            <button onClick={() => setView('dashboard')} className={`p-2 rounded-md transition-colors text-sm font-semibold ${view === 'dashboard' ? 'bg-primary text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Dashboard</button>
            <button onClick={() => setView('withdrawals')} className={`p-2 rounded-md transition-colors text-sm font-semibold ${view === 'withdrawals' ? 'bg-primary text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Saques</button>
            <button onClick={() => setView('users')} className={`p-2 rounded-md transition-colors text-sm font-semibold ${view === 'users' ? 'bg-primary text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Utilizadores</button>
            <button onClick={() => setView('transactions')} className={`p-2 rounded-md transition-colors text-sm font-semibold ${view === 'transactions' ? 'bg-primary text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Transações</button>
        </div>
    );

    const renderView = () => {
        switch(view) {
            case 'dashboard': return <AdminDashboard />;
            case 'withdrawals': return <AdminWithdrawals showNotification={showNotification} />;
            case 'users': return <AdminUsers showNotification={showNotification} />;
            case 'transactions': return <AdminTransactions />;
            default: return <AdminDashboard />;
        }
    };
    
    return (
        <div>
            <AdminNav />
            {renderView()}
        </div>
    );
};

const Header: React.FC<{ title: string; unreadCount: number; onNotificationClick: () => void }> = ({ title, unreadCount, onNotificationClick }) => (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 shadow-md flex justify-between items-center w-full max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-primary truncate pr-4">{title}</h1>
        <button onClick={onNotificationClick} className="relative text-gray-600 dark:text-gray-300">
            <BellIcon />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    </header>
);

const NotificationsPanel: React.FC<{ notifications: Notification[], onClose: () => void, onMarkAsRead: () => void }> = ({ notifications, onClose, onMarkAsRead }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start pt-16">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 max-w-md max-h-[70vh] flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Notificações</h2>
                    <button onClick={onClose}><CloseIcon /></button>
                </div>
                <div className="overflow-y-auto p-4 space-y-3">
                    {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} className={`p-3 rounded-lg relative ${n.read ? 'opacity-60' : 'bg-blue-50 dark:bg-blue-900/50'}`}>
                            {!n.read && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"></span>}
                            <p className={`font-semibold ${n.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{n.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(n.date).toLocaleString('pt-AO')}</p>
                        </div>
                    )) : <p className="text-center text-gray-500 py-8">Nenhuma notificação.</p>}
                </div>
                {notifications.some(n => !n.read) && (
                     <div className="p-2 border-t dark:border-gray-700">
                        <button onClick={onMarkAsRead} className="w-full text-sm text-primary font-semibold py-2">Marcar todas como lidas</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const BottomNav: React.FC<{ currentPage: Page; setCurrentPage: (page: Page) => void; isAdmin: boolean; pendingWithdrawalCount: number; }> = ({ currentPage, setCurrentPage, isAdmin, pendingWithdrawalCount }) => {
    const navItems = useMemo(() => [
        { page: 'dashboard', label: 'Início', icon: <HomeIcon /> },
        { page: 'invest', label: 'Investir', icon: <InvestIcon /> },
        { page: 'withdraw', label: 'Sacar', icon: <WithdrawIcon /> },
        { page: 'transactions', label: 'Transações', icon: <TransactionsIcon /> },
        { page: 'profile', label: 'Perfil', icon: <ProfileIcon /> },
        ...(isAdmin ? [{ page: 'admin', label: 'Admin', icon: <AdminIcon /> }] : [])
    ], [isAdmin]);
    
    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
            <div className="flex justify-around">
                {navItems.map(item => (
                    <button
                        key={item.page}
                        onClick={() => setCurrentPage(item.page as Page)}
                        className={`flex flex-col items-center justify-center w-full py-2 transition-colors duration-300 relative ${currentPage === item.page ? 'text-primary dark:text-secondary' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-secondary'}`}
                    >
                        {item.page === 'admin' && pendingWithdrawalCount > 0 && (
                            <span className="absolute top-1 right-[20%] flex h-4 w-4 items-center justify-center rounded-full bg-accent text-xs text-white">
                                {pendingWithdrawalCount}
                            </span>
                        )}
                        {item.icon}
                        <span className="text-xs">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

const WhatsappBanner: React.FC = () => {
    return (
        <a href={WHATSAPP_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="sticky top-0 z-20 flex items-center justify-center p-3 bg-green-500 text-white font-bold shadow-lg hover:bg-green-600 transition">
            <WhatsappIcon />
            <span className="ml-2">Entrar no Grupo de Suporte</span>
        </a>
    )
}