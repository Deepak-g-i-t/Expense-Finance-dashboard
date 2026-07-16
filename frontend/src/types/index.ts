// ─── Auth ─────────────────────────────────────────────────────
export interface LoginRequest { account_id: string; pin: string }
export interface RegisterRequest { account_id: string; pin: string; display_name?: string }
export interface AuthToken {
  access_token: string; token_type: string;
  account_id: string; display_name: string
}

// ─── Account Settings ─────────────────────────────────────────
export interface AccountSettings {
  id: number; account_id: string; display_name: string
  currency: string; monthly_budget: number
  default_payment_method: string; default_category: string
  dark_mode: boolean; created_at: string
}

// ─── Category ─────────────────────────────────────────────────
export interface Category { id: number; name: string; icon: string; color: string; is_default: boolean }

// ─── Expense ──────────────────────────────────────────────────
export interface Expense {
  id: number; amount: number; category: string; description: string
  merchant?: string; date: string; time: string; payment_method: string
  notes?: string; created_at: string; updated_at?: string
}
export interface ExpenseCreate {
  amount: number; category: string; description: string
  merchant?: string; date: string; time: string; payment_method: string; notes?: string
}

// ─── Income ───────────────────────────────────────────────────
export interface Income {
  id: number; amount: number; source: string; description: string
  date: string; time: string; notes?: string; created_at: string; updated_at?: string
}
export interface IncomeCreate {
  amount: number; source: string; description: string; date: string; time: string; notes?: string
}

// ─── Budget ───────────────────────────────────────────────────
export interface Budget {
  id: number; category: string; amount: number; month: number; year: number
  spent: number; remaining: number; percentage: number
}
export interface BudgetCreate { category: string; amount: number; month: number; year: number }

// ─── Reminder ─────────────────────────────────────────────────
export type ReminderPriority = 'low' | 'medium' | 'high'
export type ReminderRepeat = 'one_time' | 'weekly' | 'monthly' | 'yearly'
export type ReminderStatus = 'pending' | 'completed' | 'overdue'

export interface Reminder {
  id: number; title: string; description?: string; amount?: number
  due_date: string; reminder_date: string; priority: ReminderPriority
  repeat: ReminderRepeat; status: ReminderStatus; created_at: string
}

// ─── Dashboard ────────────────────────────────────────────────
export interface DashboardStats {
  current_balance: number; total_income: number; total_expenses: number; savings: number
  current_month_spending: number; today_spending: number; this_week_spending: number
  remaining_monthly_budget: number
}

export interface MonthlyTrend { month: string; income: number; expenses: number; savings: number }
export interface CategoryStat { category: string; amount: number; count: number; percentage: number }
export interface DailySpending { date: string; amount: number }

// ─── Transactions ─────────────────────────────────────────────
export interface TransactionItem {
  id: number; type: 'expense' | 'income'; amount: number; description: string
  category?: string; source?: string; date: string; time: string
  payment_method?: string; merchant?: string; notes?: string; created_at: string
}

export interface PaginatedTransactions {
  items: TransactionItem[]; total: number; page: number; page_size: number; total_pages: number
}

export interface TransactionFilters {
  page?: number; page_size?: number; search?: string; category?: string
  payment_method?: string; date_from?: string; date_to?: string; sort_by?: string
}

// ─── Analytics ────────────────────────────────────────────────
export interface AnalyticsSummary {
  year: number; total_income: number; total_expenses: number; savings: number
  avg_daily_expense: number; avg_monthly_expense: number; transaction_count: number
  most_used_payment: string | null
  payment_breakdown: { method: string; count: number; amount: number }[]
  top_merchants: { merchant: string; total: number; count: number }[]
  category_breakdown: { category: string; total: number; count: number }[]
  highest_expense: { amount: number; description: string; date: string } | null
  highest_income: { amount: number; description: string; date: string } | null
}

export interface CalendarData {
  [date: string]: {
    expenses?: { total: number; count: number }
    income?: { total: number; count: number }
    reminders?: { id: number; title: string; status: string; priority: string }[]
  }
}
