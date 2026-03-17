import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Btn95, H1, Sub, P } from '../Win95Window.jsx';
import { W, SANS, raised, sunken } from '../theme.js';

// ── Fill these in after setting up EmailJS ─────────────────────────────────
const EMAILJS_SERVICE_ID  = 'service_3j76r8d';
const EMAILJS_TEMPLATE_ID = 'template_igo1o8q';
const EMAILJS_PUBLIC_KEY  = 's5g8IE29tADh88cZa';
// ──────────────────────────────────────────────────────────────────────────

const SOCIAL = [
  { icon: '🐙', label: 'GitHub',   href: 'https://github.com/vishakha1801' },
  { icon: '💼', label: 'LinkedIn', href: 'https://www.linkedin.com/in/vishakha-pathak-b6643b20a/' },
];

const ContactPage = () => {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [message, setMessage] = useState('');
  const [status,  setStatus]  = useState('idle'); // idle | sending | sent | error

  const fieldStyle = {
    width: '100%', boxSizing: 'border-box',
    background: W.content, fontFamily: SANS, fontSize: 10,
    padding: '3px 5px', color: W.black, outline: 'none',
    ...sunken,
  };

  const handleSend = async () => {
    if (!name || !email || !message) return;
    setStatus('sending');
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { from_name: name, from_email: email, message },
        EMAILJS_PUBLIC_KEY,
      );
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{ padding: '24px 20px 16px' }}>
      <H1>Contact</H1>
      <Sub>Let&apos;s get in touch</Sub>

      <P>
        I&apos;m currently open to new opportunities full-time roles and interesting
        collaborations. Feel free to reach out directly or use the form below.
      </P>
      <P>
        <b>Email: </b>
        <a href="mailto:vishakhamanojpathak18@gmail.com" style={{ color: '#000080' }}>
          vishakhamanojpathak18@gmail.com
        </a>
      </P>

      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {SOCIAL.map(s => (
          <a key={s.label} href={s.href} target="_blank" rel="noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: SANS, fontSize: 10, color: W.black, textDecoration: 'none',
            background: W.winBg, padding: '2px 8px', ...raised,
          }}>
            {s.icon} {s.label}
          </a>
        ))}
      </div>

      {status === 'sent' ? (
        <div style={{ ...sunken, background: '#e0ffe0', padding: '10px 12px', fontFamily: SANS, fontSize: 11, color: '#004400' }}>
          ✓ Message sent! I&apos;ll get back to you soon.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Name',  val: name,  set: setName,  type: 'text',  placeholder: 'Your name' },
            { label: 'Email', val: email, set: setEmail, type: 'email', placeholder: 'you@example.com' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: W.black, marginBottom: 2 }}>{f.label}:</div>
              <input
                type={f.type} value={f.val}
                onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                style={fieldStyle}
              />
            </div>
          ))}
          <div>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: W.black, marginBottom: 2 }}>Message:</div>
            <textarea
              rows={3} value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Your message..."
              style={{ ...fieldStyle, resize: 'none' }}
            />
          </div>
          {status === 'error' && (
            <div style={{ fontFamily: SANS, fontSize: 10, color: '#aa0000' }}>
              Something went wrong. Try emailing me directly.
            </div>
          )}
          <Btn95
            onClick={handleSend}
            style={{ alignSelf: 'flex-start', opacity: status === 'sending' ? 0.6 : 1 }}
          >
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </Btn95>
        </div>
      )}
    </div>
  );
};

export default ContactPage;
