import { useState } from 'react';
import { Link } from 'react-router-dom';
import { aiApi } from '../services/ticketsApi';
import { useAuth } from '../context/AuthContext';
import { canCreateTickets } from '../constants/roles';

export default function HelpChatWidget() {
  const { hasRole } = useAuth();
  const showCreateLink = canCreateTickets(hasRole);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hi! I am your IT Help Desk guide. Ask me how to fix common issues or what to do next — I will not create tickets for you.',
    },
  ]);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setBusy(true);
    try {
      const { data } = await aiApi.helpChat(q);
      const steps = data.nextSteps?.length
        ? `\n\nNext steps:\n${data.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        : '';
      const suggest = data.suggestCreateTicket && showCreateLink
        ? '\n\nIf this does not help, open Create Ticket or use AI Quick Ticket.'
        : data.suggestCreateTicket
          ? '\n\nIf this does not help, contact your IT help desk to open a ticket.'
          : '';
      setMessages((m) => [...m, { role: 'bot', text: data.answer + steps + suggest, suggestTicket: data.suggestCreateTicket }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Sorry, I could not respond. Please try again.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="help-chat-widget">
      {open && (
        <div className="help-chat-panel">
          <div className="help-chat-header">
            <strong>Help Desk Guide</strong>
            <span className="text-muted">Troubleshooting assistant</span>
            <button type="button" className="toast-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
          <div className="help-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`help-chat-msg ${m.role}`}>
                <p>{m.text}</p>
                {m.suggestTicket && showCreateLink && (
                  <Link to="/tickets/new" className="link-sm" onClick={() => setOpen(false)}>Create a ticket →</Link>
                )}
              </div>
            ))}
          </div>
          <div className="help-chat-input">
            <input
              type="text"
              placeholder="e.g. VPN not working from home"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={send} disabled={busy}>
              {busy ? '…' : 'Ask'}
            </button>
          </div>
        </div>
      )}
      <button type="button" className="help-chat-fab" onClick={() => setOpen((v) => !v)} title="Help Desk Guide">
        {open ? '✕' : '💡'}
      </button>
    </div>
  );
}
