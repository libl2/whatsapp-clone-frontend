import React, { useEffect, useRef, useState } from "react";
import { fetchStatuses } from "../../services/api.service";
import { getDocumentDirection } from "../../utils/direction";

const StatusViewer = ({ onClose }) => {
  const [statuses, setStatuses] = useState([]);
  const [groupedStatuses, setGroupedStatuses] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  // שמור מזהי סטטוסים שנקראו ב-localStorage
  const [readStatusIds, setReadStatusIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('readStatusIds') || '{}');
    } catch {
      return {};
    }
  });
  const firstUnreadRef = useRef(null);

  useEffect(() => {
    fetchStatuses().then((res) => {
      const data = res.data;
      const grouped = {};
      data.forEach((status) => {
        if (!grouped[status.contactId]) {
          grouped[status.contactId] = {
            contactName: status.contactName,
            avatar: status.avatarUrl,
            statuses: [],
            // track last timestamp for this contact to show in list
            lastTimestamp: status.timestamp || null,
          };
        }
        grouped[status.contactId].statuses.push(status);
        // update lastTimestamp to the latest (max) timestamp
        if (status.timestamp && (!grouped[status.contactId].lastTimestamp || status.timestamp > grouped[status.contactId].lastTimestamp)) {
          grouped[status.contactId].lastTimestamp = status.timestamp;
        }
      });
      setGroupedStatuses(grouped);
    });
  }, []);

  useEffect(() => {
    const isVideo = selectedContact && groupedStatuses[selectedContact]?.statuses[currentIndex]?.type === 'video';
    if (selectedContact && !isVideo) {
      const timer = setTimeout(() => handleNext(), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, selectedContact]);

  // כאשר בוחרים איש קשר, קפוץ לסטטוס הראשון שלא נקרא
  useEffect(() => {
    if (selectedContact && groupedStatuses[selectedContact]) {
      const statuses = groupedStatuses[selectedContact].statuses;
      const firstUnreadIdx = statuses.findIndex(s => !(readStatusIds[selectedContact] || []).includes(s.id));
      setCurrentIndex(firstUnreadIdx !== -1 ? firstUnreadIdx : 0);
    }
  // eslint-disable-next-line
  }, [selectedContact, groupedStatuses]);

  // כאשר מוצג סטטוס, סמן אותו כנקרא
  useEffect(() => {
    if (selectedContact && groupedStatuses[selectedContact]) {
      const status = groupedStatuses[selectedContact].statuses[currentIndex];
      if (status && !(readStatusIds[selectedContact] || []).includes(status.id)) {
        const updated = {
          ...readStatusIds,
          [selectedContact]: [...(readStatusIds[selectedContact] || []), status.id]
        };
        setReadStatusIds(updated);
        localStorage.setItem('readStatusIds', JSON.stringify(updated));
      }
    }
  // eslint-disable-next-line
  }, [currentIndex, selectedContact, groupedStatuses]);

  // קפיצה להודעה הראשונה שלא נקראה
  useEffect(() => {
    if (statuses.length > 0) {
      const firstUnreadIdx = statuses.findIndex(s => !(readStatusIds[selectedContact] || []).includes(s.id));
      if (firstUnreadIdx !== -1 && firstUnreadRef.current) {
        firstUnreadRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [statuses, selectedContact, readStatusIds]);

  // כאשר מוצגת הודעה, סמן אותה כנקראה
  useEffect(() => {
    if (statuses.length > 0) {
      const firstUnreadIdx = statuses.findIndex(s => !(readStatusIds[selectedContact] || []).includes(s.id));
      if (firstUnreadIdx !== -1) {
        const toMark = statuses.slice(firstUnreadIdx).map(s => s.id);
        const updated = {
          ...readStatusIds,
          [selectedContact]: [...(readStatusIds[selectedContact] || []), ...toMark]
        };
        setReadStatusIds(updated);
        localStorage.setItem('readStatusIds', JSON.stringify(updated));
        // אפשרות: שלח לשרת/וואטסאפ שההודעות נקראו
      }
    }
  }, [statuses, selectedContact]);

  // === סגנונות CSS ===
  const documentDirection = getDocumentDirection();
  const mainContainerStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    display: 'flex', direction: documentDirection,
    backgroundColor: 'var(--main-bg, #eef0f1)',
    zIndex: 2000,
  };

  const statusViewerStyle = {
    flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'var(--viewer-bg, #111b21)',
    position: 'relative', height: '100%',
  };

  const sidebarStyle = {
    width: 350, background: 'var(--sidebar-bg, #fff)',
    borderLeft: '1px solid var(--sidebar-border, #e0e0e0)',
    height: '100vh', overflowY: 'auto',
  };

  const statusBoxStyle = {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center',
    padding: '20px', color: 'var(--status-text, #fff)',
    position: 'relative',
  };

  // === פונקציות ניווט וסגירה ===
  const handleCloseViewer = () => setSelectedContact(null);

  // format timestamp (seconds) to readable string, respecting today/yesterday
  const formatTimestamp = (unixTs) => {
    if (!unixTs) return '';
    // message.timestamp appears to be in seconds
    const date = new Date(unixTs * 1000);
    const now = new Date();
    const isSameDay = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isSameDay) return `היום, ${timeStr}`;
    if (isYesterday) return `אתמול, ${timeStr}`;
    // otherwise show date and time
    const dateStr = date.toLocaleDateString();
    return `${dateStr}, ${timeStr}`;
  };

  const handleNext = () => {
    if (!selectedContact) return;
    const contactStatuses = groupedStatuses[selectedContact].statuses;
    if (currentIndex < contactStatuses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleCloseViewer(); // בסיום הסטטוסים של איש קשר, חזור לרשימה
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // current status for the selected contact
  const currentStatus = selectedContact ? groupedStatuses[selectedContact]?.statuses?.[currentIndex] : null;

  // === רכיבי תצוגה ===
  const renderStatusContent = (status) => {
    if (!status) return null;
    // הצגת מדיה או הודעה
    if (status.mediaUrl) {
      if (status.type === 'image') {
        return (
            <div>
                <img src={status.mediaUrl} alt="status" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8, objectFit: 'contain' }} />
                <p>{status.body}</p>
            </div>
        );
      }
      if (status.type === 'video') {
        return (
            <div>
                <video key={status.id} src={status.mediaUrl} autoPlay onEnded={handleNext} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8 }} />
                <p>{status.body}</p>
            </div>
        );
      }
    }

    if (status.type === 'chat') {
      return (
        <div style={{
          marginTop: 16, fontSize: 24, padding: '40px 20px',
          backgroundColor: '#384953', borderRadius: 8, minWidth: '300px', maxWidth: '500px'
        }}>
          {status.body}
        </div>
      );
    }
    return null;
  };

  const renderProgressBars = () => {
    const contactData = groupedStatuses[selectedContact];
    if (!contactData || contactData.statuses.length <= 1) return null;
    return (
      <div style={{ position: 'absolute', top: 20, width: '95%', display: 'flex', gap: '4px', zIndex: 10 }}>
        {contactData.statuses.map((_, index) => (
          <div key={index} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: index <= currentIndex ? '#fff' : 'rgba(255,255,255,0.4)',
            transition: 'background 0.3s linear'
          }}></div>
        ))}
      </div>
    );
  };

  return (
    <div style={mainContainerStyle}>
      {/* FIX: Reordered elements and corrected styles for RTL */}

      {/* סרגל צד עם רשימת אנשי הקשר */}
      <div style={sidebarStyle}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 16px 8px 16px', borderBottom: '1px solid var(--sidebar-border, #eee)'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: 22 }}>סטטוס</span>
          {/* FIX: This button now closes the entire component */}
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 24, cursor: 'pointer',
            color: 'var(--sidebar-close, #555)'
          }}>✕</button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Object.entries(groupedStatuses).map(([contactId, { contactName, avatar, statuses }]) => {
            const unreadCount = statuses.filter(s => !(readStatusIds[contactId] || []).includes(s.id)).length;
            return (
              <li key={contactId}
                style={{
                  display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer',
                  backgroundColor: selectedContact === contactId ? '#f0f0f0' : 'transparent',
                  borderRight: selectedContact === contactId ? '4px solid #00a884' : 'none'
                }}
                onClick={() => { setSelectedContact(contactId); setCurrentIndex(0); }}>
                <img src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=random`} alt={contactName} style={{ width: 48, height: 48, borderRadius: '50%', marginLeft: 16, border: '2.5px solid #25d366' }} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 17 }}>
                    {contactName}
                    {unreadCount > 0 && (
                      <span style={{
                        background: '#25d366', color: '#fff', borderRadius: '50%',
                        padding: '2px 8px', fontSize: 13, marginRight: 8, marginLeft: 4
                      }}>{unreadCount}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>{
                    // show last status timestamp for this contact if available
                    (groupedStatuses[contactId] && groupedStatuses[contactId].lastTimestamp) ? formatTimestamp(groupedStatuses[contactId].lastTimestamp) : ''
                  }</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* תצוגת הסטטוס המרכזית */}
      {selectedContact && (
        <div style={statusViewerStyle}>
          <div style={statusBoxStyle}>
            {/* FIX: This button now closes only the viewer, not the component */}
            <button onClick={handleCloseViewer} style={{
              position: 'absolute', top: 15, right: 20,
              background: 'none', color: '#fff', border: 'none', fontSize: 30,
              cursor: 'pointer', zIndex: 11
            }}>✕</button>

            <div style={{ position: 'absolute', top: 50, right: 20, display: 'flex', alignItems: 'center', zIndex: 10 }}>
              <img src={groupedStatuses[selectedContact].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupedStatuses[selectedContact].contactName)}&background=random`} alt="" style={{ width: 40, height: 40, borderRadius: '50%', marginLeft: 12 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 'bold', fontSize: 17 }}>{groupedStatuses[selectedContact].contactName}</span>
                <div style={{ fontSize: 13, color: '#ccc', marginTop: 4 }}>{
                  // show timestamp of the currently displayed status, fallback to contact lastTimestamp
                  currentStatus?.timestamp ? formatTimestamp(currentStatus.timestamp) : formatTimestamp(groupedStatuses[selectedContact].lastTimestamp)
                }</div>
              </div>
            </div>
            {renderProgressBars()}
            {renderStatusContent(groupedStatuses[selectedContact].statuses[currentIndex])}

            {/* כפתורי ניווט בלתי נראים */}
            <div onClick={handleNext} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', zIndex: 2, cursor: 'pointer' }}></div>
            <div onClick={handlePrev} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', zIndex: 2, cursor: 'pointer' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusViewer;
