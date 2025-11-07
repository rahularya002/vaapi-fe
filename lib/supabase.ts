import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client only if environment variables are present
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Database types
export interface Candidate {
  id: number;
  name: string;
  phone: string;
  email: string;
  position: string;
  status: string;
  call_result?: string;
  call_notes?: string;
  call_time?: string;
  added_at?: string;
  call_start_time?: string;
  call_end_time?: string;
  created_at?: string;
  updated_at?: string;
  vapi_call_id?: string;
  // VAPI call log fields
  assistant_name?: string;
  assistant_id?: string;
  assistant_phone_number?: string;
  call_type?: string; // "outbound" | "web"
  ended_reason?: string;
  success_evaluation?: string; // "pass" | "fail"
  score?: string;
  call_duration?: number; // in seconds
  call_cost?: number;
}

export interface CallConfig {
  id?: number;
  method: "vapi" | "twilio" | "hybrid";
  script: string;
  voice_settings: {
    provider: string;
    voice_id: string;
    speed: number;
    pitch: number;
  };
  call_settings: {
    max_duration: number;
    retry_attempts: number;
    delay_between_calls: number;
  };
  created_at?: string;
  updated_at?: string;
}

// Fallback storage for when Supabase is not configured
let fallbackCandidates: Candidate[] = [];
let fallbackConfig: CallConfig | null = null;

// Candidates table operations
export const candidatesApi = {
  async getAll() {
    if (!supabase) {
      console.warn("Supabase not configured, using fallback storage");
      return fallbackCandidates;
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: number) {
    if (!supabase) {
      return fallbackCandidates.find(c => c.id === id) || null;
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) {
      const newCandidate = {
        ...candidate,
        id: fallbackCandidates.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackCandidates.push(newCandidate);
      return newCandidate;
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert([candidate])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createMany(candidates: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>[]) {
    if (!supabase) {
      const newCandidates = candidates.map((candidate, index) => ({
        ...candidate,
        id: fallbackCandidates.length + index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      fallbackCandidates.push(...newCandidates);
      return newCandidates;
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert(candidates)
      .select();
    
    if (error) throw error;
    return data || [];
  },

  async update(id: number, updates: Partial<Candidate>) {
    console.log(`[Candidates API] update called for id: ${id}`, updates);
    if (!supabase) {
      console.log("[Candidates API] Using fallback storage for update");
      const index = fallbackCandidates.findIndex(c => c.id === id);
      if (index !== -1) {
        fallbackCandidates[index] = { ...fallbackCandidates[index], ...updates, updated_at: new Date().toISOString() };
        console.log(`[Candidates API] Fallback update successful:`, fallbackCandidates[index]);
        return fallbackCandidates[index];
      }
      console.error(`[Candidates API] Candidate ${id} not found in fallback`);
      return null;
    }

    const { data, error } = await supabase
      .from('candidates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`[Candidates API] Error updating candidate ${id}:`, error);
      throw error;
    }
    console.log(`[Candidates API] Update successful:`, data);
    return data;
  },

  async delete(id: number) {
    if (!supabase) {
      fallbackCandidates = fallbackCandidates.filter(c => c.id !== id);
      return;
    }

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteMany(ids: number[]) {
    if (!supabase) {
      fallbackCandidates = fallbackCandidates.filter(c => !ids.includes(c.id));
      return;
    }

    const { error } = await supabase
      .from('candidates')
      .delete()
      .in('id', ids);
    
    if (error) throw error;
  },

  async getByStatus(status: string) {
    console.log(`[Candidates API] getByStatus called with status: ${status}`);
    if (!supabase) {
      console.log("[Candidates API] Using fallback storage");
      const filtered = fallbackCandidates.filter(c => c.status === status);
      console.log(`[Candidates API] Fallback result - count: ${filtered.length}`);
      return filtered;
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`[Candidates API] Error getting by status ${status}:`, error);
      throw error;
    }
    console.log(`[Candidates API] getByStatus result - count: ${data?.length || 0}`, data);
    return data || [];
  }
};

// Call queue operations
export const callQueueApi = {
  async getQueue() {
    console.log("[Call Queue API] getQueue called");
    const queue = await candidatesApi.getByStatus('pending');
    console.log(`[Call Queue API] getQueue result - count: ${queue.length}`);
    return queue;
  },

  async addToQueue(candidates: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>[]) {
    console.log(`[Call Queue API] addToQueue called with ${candidates.length} candidates`);
    const candidatesWithStatus = candidates.map(candidate => ({
      ...candidate,
      status: 'pending',
      added_at: new Date().toISOString()
    }));
    
    const result = await candidatesApi.createMany(candidatesWithStatus);
    console.log(`[Call Queue API] addToQueue result - count: ${result.length}`);
    return result;
  },

  async updateStatus(id: number, status: string, additionalData?: Partial<Candidate>) {
    console.log(`[Call Queue API] updateStatus called - id: ${id}, status: ${status}`, additionalData);
    const updates: Partial<Candidate> = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    if (status === 'calling') {
      updates.call_start_time = new Date().toISOString();
    } else if (status === 'completed') {
      updates.call_end_time = new Date().toISOString();
    }

    console.log(`[Call Queue API] Updating with data:`, updates);
    const result = await candidatesApi.update(id, updates);
    console.log(`[Call Queue API] updateStatus result:`, result);
    return result;
  },

  async clearQueue() {
    if (!supabase) {
      fallbackCandidates = fallbackCandidates.filter(c => c.status !== 'pending');
      return;
    }

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('status', 'pending');
    
    if (error) throw error;
  }
};

// Call history operations
export const callHistoryApi = {
  async getHistory() {
    console.log("[Call History API] getHistory called");
    const history = await candidatesApi.getByStatus('completed');
    console.log(`[Call History API] getHistory result - count: ${history.length}`, history);
    return history;
  },

  async addToHistory(candidate: Candidate) {
    console.log(`[Call History API] addToHistory called for candidate:`, candidate);
    const historyCandidate = {
      ...candidate,
      status: 'completed',
      call_end_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await candidatesApi.update(candidate.id, historyCandidate);
    console.log(`[Call History API] addToHistory result:`, result);
    return result;
  }
};

// Configuration operations
export const configApi = {
  async get() {
    if (!supabase) {
      return fallbackConfig;
    }

    const { data, error } = await supabase
      .from('call_configs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data;
  },

  async save(config: Omit<CallConfig, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) {
      fallbackConfig = {
        ...config,
        id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return fallbackConfig;
    }

    const existing = await this.get();
    
    if (existing) {
      const { data, error } = await supabase
        .from('call_configs')
        .update({ ...config, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('call_configs')
        .insert([config])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }
};

// User types and operations
export interface User {
  id?: number;
  email: string;
  password_hash: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

let fallbackUsers: User[] = [];

export const usersApi = {
  async getByEmail(email: string): Promise<User | null> {
    if (!supabase) {
      return fallbackUsers.find(u => u.email === email) || null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && (error as any).code !== 'PGRST116') throw error;
    return data as User | null;
  },

  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    if (!supabase) {
      const newUser = {
        ...user,
        id: fallbackUsers.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackUsers.push(newUser);
      return newUser;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getByEmail(email);
    if (!user) return null;

    // Simple password comparison (in production, use bcrypt)
    // For now, we'll use a simple hash stored in DB
    // In production, replace this with bcrypt.compare(password, user.password_hash)
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    
    if (hash === user.password_hash) {
      return user;
    }
    return null;
  }
};

// Credits operations (mock with optional Supabase backing)
export interface UserCredits {
  email: string;
  credits: number;
  updated_at?: string;
}

let fallbackCredits: Record<string, number> = {};

export const creditsApi = {
  DEFAULT_CREDITS: 2,

  async getOrInit(email: string): Promise<UserCredits> {
    if (!email) throw new Error("Email required for credits");

    if (!supabase) {
      const current = fallbackCredits[email] ?? this.DEFAULT_CREDITS;
      fallbackCredits[email] = current;
      return { email, credits: current, updated_at: new Date().toISOString() };
    }

    try {
      // Supabase table optional: user_credits(email text primary key, credits int, updated_at timestamptz)
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('email', email)
        .single();

      // If no row found (PGRST116), create one
      if (error && (error as any).code === 'PGRST116') {
        const { data: inserted, error: insertError } = await supabase
          .from('user_credits')
          .insert({ email, credits: this.DEFAULT_CREDITS })
          .select()
          .single();
        
        if (insertError) {
          console.error("Failed to create credits in DB, using fallback:", insertError);
          // Fall back to in-memory storage if DB insert fails
          const current = fallbackCredits[email] ?? this.DEFAULT_CREDITS;
          fallbackCredits[email] = current;
          return { email, credits: current, updated_at: new Date().toISOString() };
        }
        return inserted as UserCredits;
      }

      if (error) {
        console.error("Failed to fetch credits from DB, using fallback:", error);
        // Fall back to in-memory storage on any other error
        const current = fallbackCredits[email] ?? this.DEFAULT_CREDITS;
        fallbackCredits[email] = current;
        return { email, credits: current, updated_at: new Date().toISOString() };
      }

      if (!data) {
        // This shouldn't happen, but handle it gracefully
        const current = fallbackCredits[email] ?? this.DEFAULT_CREDITS;
        fallbackCredits[email] = current;
        return { email, credits: current, updated_at: new Date().toISOString() };
      }

      return data as UserCredits;
    } catch (err) {
      console.error("Unexpected error in getOrInit, using fallback:", err);
      // Fall back to in-memory storage on any exception
      const current = fallbackCredits[email] ?? this.DEFAULT_CREDITS;
      fallbackCredits[email] = current;
      return { email, credits: current, updated_at: new Date().toISOString() };
    }
  },

  async consume(email: string, amount = 1): Promise<UserCredits> {
    if (!email) throw new Error("Email required for credits");

    if (!supabase) {
      const current = fallbackCredits[email] ?? this.DEFAULT_CREDITS;
      if (current < amount) {
        throw new Error('INSUFFICIENT_CREDITS');
      }
      const next = current - amount;
      fallbackCredits[email] = next;
      return { email, credits: next, updated_at: new Date().toISOString() };
    }

    try {
      // Use RPC or row-level update
      const current = await this.getOrInit(email);
      if (current.credits < amount) throw new Error('INSUFFICIENT_CREDITS');
      
      const { data, error } = await supabase
        .from('user_credits')
        .update({ credits: current.credits - amount, updated_at: new Date().toISOString() })
        .eq('email', email)
        .select()
        .single();
      
      if (error) {
        console.error("Failed to update credits in DB, using fallback:", error);
        // Fall back to in-memory storage
        const next = (fallbackCredits[email] ?? current.credits) - amount;
        fallbackCredits[email] = next;
        return { email, credits: next, updated_at: new Date().toISOString() };
      }
      
      return data as UserCredits;
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_CREDITS') throw err;
      console.error("Unexpected error in consume, using fallback:", err);
      // Fall back to in-memory storage
      const current = fallbackCredits[email] ?? this.DEFAULT_CREDITS;
      if (current < amount) throw new Error('INSUFFICIENT_CREDITS');
      const next = current - amount;
      fallbackCredits[email] = next;
      return { email, credits: next, updated_at: new Date().toISOString() };
    }
  },
};

// Export/Import operations
export const dataApi = {
  async exportData() {
    const [candidates, config] = await Promise.all([
      candidatesApi.getAll(),
      configApi.get()
    ]);

    return {
      candidates,
      config,
      exported_at: new Date().toISOString()
    };
  },

  async importData(data: any) {
    if (data.candidates && Array.isArray(data.candidates)) {
      if (!supabase) {
        fallbackCandidates = data.candidates;
      } else {
        // Clear existing data
        await supabase.from('candidates').delete().neq('id', 0);
        
        // Insert new data
        await candidatesApi.createMany(data.candidates);
      }
    }

    if (data.config) {
      await configApi.save(data.config);
    }
  },

  async clearAllData() {
    if (!supabase) {
      fallbackCandidates = [];
      fallbackConfig = null;
    } else {
      await supabase.from('candidates').delete().neq('id', 0);
      await supabase.from('call_configs').delete().neq('id', 0);
    }
  }
};
