/**
 * Professional Logger/Debugger Utility
 *
 * Bietet strukturiertes Logging mit verschiedenen Log-Levels,
 * Zeitstempeln, Kategorien und optionaler Konsolen-Ausgabe
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Maximale Anzahl gespeicherter Logs
  private enabled = true;
  private logToConsole = true;

  // Farben für die Konsolen-Ausgabe
  private colors = {
    debug: '#9CA3AF',    // gray-400
    info: '#3B82F6',     // blue-500
    warn: '#F59E0B',     // amber-500
    error: '#EF4444',    // red-500
    success: '#10B981',  // green-500
  };

  // Icons für verschiedene Log-Levels
  private icons = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅',
  };

  /**
   * Aktiviert oder deaktiviert das Logging
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Aktiviert oder deaktiviert die Konsolen-Ausgabe
   */
  setConsoleOutput(enabled: boolean) {
    this.logToConsole = enabled;
  }

  /**
   * Setzt die maximale Anzahl gespeicherter Logs
   */
  setMaxLogs(max: number) {
    this.maxLogs = max;
    this.trimLogs();
  }

  /**
   * Erstellt einen neuen Log-Eintrag
   */
  private createLog(level: LogLevel, category: string, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };

    // Füge Stack-Trace bei Fehlern hinzu
    if (level === 'error' && data instanceof Error) {
      entry.stack = data.stack;
    }

    return entry;
  }

  /**
   * Speichert einen Log-Eintrag
   */
  private saveLog(entry: LogEntry) {
    if (!this.enabled) return;

    this.logs.push(entry);
    this.trimLogs();

    // Konsolen-Ausgabe
    if (this.logToConsole) {
      this.printToConsole(entry);
    }
  }

  /**
   * Gibt einen Log-Eintrag in der Konsole aus
   */
  private printToConsole(entry: LogEntry) {
    const time = entry.timestamp.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });

    const icon = this.icons[entry.level];
    const color = this.colors[entry.level];

    const prefix = `%c${icon} [${time}] [${entry.category.toUpperCase()}]`;
    const style = `color: ${color}; font-weight: bold;`;

    switch (entry.level) {
      case 'error':
        console.error(prefix, style, entry.message, entry.data || '');
        if (entry.stack) console.error(entry.stack);
        break;
      case 'warn':
        console.warn(prefix, style, entry.message, entry.data || '');
        break;
      case 'debug':
        console.debug(prefix, style, entry.message, entry.data || '');
        break;
      default:
        console.log(prefix, style, entry.message, entry.data || '');
    }
  }

  /**
   * Begrenzt die Anzahl gespeicherter Logs
   */
  private trimLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Debug-Level Logging (nur in Entwicklung sichtbar)
   */
  debug(category: string, message: string, data?: any) {
    this.saveLog(this.createLog('debug', category, message, data));
  }

  /**
   * Info-Level Logging
   */
  info(category: string, message: string, data?: any) {
    this.saveLog(this.createLog('info', category, message, data));
  }

  /**
   * Warn-Level Logging
   */
  warn(category: string, message: string, data?: any) {
    this.saveLog(this.createLog('warn', category, message, data));
  }

  /**
   * Error-Level Logging
   */
  error(category: string, message: string, data?: any) {
    this.saveLog(this.createLog('error', category, message, data));
  }

  /**
   * Success-Level Logging
   */
  success(category: string, message: string, data?: any) {
    this.saveLog(this.createLog('success', category, message, data));
  }

  /**
   * Loggt einen API-Request
   */
  apiRequest(method: string, url: string, data?: any) {
    this.info('API', `${method} ${url}`, data);
  }

  /**
   * Loggt eine API-Response
   */
  apiResponse(method: string, url: string, status: number, data?: any) {
    if (status >= 200 && status < 300) {
      this.success('API', `${method} ${url} → ${status}`, data);
    } else if (status >= 400) {
      this.error('API', `${method} ${url} → ${status}`, data);
    } else {
      this.warn('API', `${method} ${url} → ${status}`, data);
    }
  }

  /**
   * Loggt einen User-Event
   */
  userEvent(action: string, details?: any) {
    this.info('USER', action, details);
  }

  /**
   * Loggt den Start einer Operation
   */
  startOperation(category: string, operation: string, data?: any) {
    this.info(category, `▶️ Start: ${operation}`, data);
  }

  /**
   * Loggt das Ende einer Operation
   */
  endOperation(category: string, operation: string, duration?: number, data?: any) {
    const durationStr = duration ? ` (${duration}ms)` : '';
    this.success(category, `✓ Ende: ${operation}${durationStr}`, data);
  }

  /**
   * Gibt alle Logs zurück
   */
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Gibt Logs nach Level gefiltert zurück
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Gibt Logs nach Kategorie gefiltert zurück
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Gibt Logs in einem Zeitbereich zurück
   */
  getLogsByTimeRange(start: Date, end: Date): LogEntry[] {
    return this.logs.filter(log =>
      log.timestamp >= start && log.timestamp <= end
    );
  }

  /**
   * Exportiert Logs als JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Exportiert Logs als CSV
   */
  exportAsCSV(): string {
    const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Data'];
    const rows = this.logs.map(log => [
      log.timestamp.toISOString(),
      log.level,
      log.category,
      log.message,
      log.data ? JSON.stringify(log.data) : ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  /**
   * Lädt Logs aus dem LocalStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('vocademy_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Logs:', error);
    }
  }

  /**
   * Speichert Logs im LocalStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem('vocademy_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Fehler beim Speichern der Logs:', error);
    }
  }

  /**
   * Löscht alle Logs
   */
  clear() {
    this.logs = [];
    localStorage.removeItem('vocademy_logs');
    this.info('LOGGER', 'Alle Logs gelöscht');
  }

  /**
   * Gibt Statistiken über die Logs zurück
   */
  getStatistics() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        debug: this.logs.filter(l => l.level === 'debug').length,
        info: this.logs.filter(l => l.level === 'info').length,
        warn: this.logs.filter(l => l.level === 'warn').length,
        error: this.logs.filter(l => l.level === 'error').length,
        success: this.logs.filter(l => l.level === 'success').length,
      },
      byCategory: {} as Record<string, number>
    };

    this.logs.forEach(log => {
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Erstellt einen Performance-Messer
   */
  createTimer(category: string, operation: string) {
    const startTime = performance.now();
    this.startOperation(category, operation);

    return {
      end: (data?: any) => {
        const duration = Math.round(performance.now() - startTime);
        this.endOperation(category, operation, duration, data);
        return duration;
      }
    };
  }
}

// Singleton-Instanz
const logger = new Logger();

// In Entwicklung: Logs automatisch laden/speichern
if (import.meta.env.DEV) {
  logger.loadFromStorage();

  // Speichere Logs alle 30 Sekunden
  setInterval(() => {
    logger.saveToStorage();
  }, 30000);

  // Speichere Logs beim Verlassen der Seite
  window.addEventListener('beforeunload', () => {
    logger.saveToStorage();
  });
}

// In Produktion: Nur Warnungen und Fehler
if (import.meta.env.PROD) {
  logger.setConsoleOutput(false);
}

export default logger;
