import React, { useEffect, useState } from "react";
import { fetchStatuses } from "../../services/api.service";

const StatusViewer = ({ onClose }) => {
  const [statuses, setStatuses] = useState([]);
  const [groupedStatuses, setGroupedStatuses] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchStatuses().then((res) => {
      const data = res.data;
      //console.log('סטטוסים מהשרת:', data);
      const grouped = {};
      data.forEach((status) => {
        if (!grouped[status.contactId]) {
          grouped[status.contactId] = {
            contactName: status.contactName,
            avatar: status.avatarUrl,
            statuses: [],
          };
        }
        grouped[status.contactId].statuses.push(status);
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

  // === סגנונות CSS ===
  const mainContainerStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    display: 'flex', direction: 'rtl',
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

  // === רכיבי תצוגה ===
  const renderStatusContent = (status) => {
    if (!status) return null;
        //console.log('סטטוס נבחר:', status);
    // הצגת מדיה או הודעה
    if (status.mediaUrl) {
      if (status.type === 'image') {
        console.log('מציג תמונה');
        return (
          <img src={status.mediaUrl} alt="status" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8, objectFit: 'contain' }} />
        );
      }
      if (status.type === 'video') {
        return (
          <video key={status.id} src={status.mediaUrl} autoPlay onEnded={handleNext} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8 }} />
        );
      }
    }
    if (status.content) {
      return (
        <div style={{
          marginTop: 16, fontSize: 24, padding: '40px 20px',
          backgroundColor: '#384953', borderRadius: 8, minWidth: '300px', maxWidth: '500px'
        }}>
          {status.content}
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
          {Object.entries(groupedStatuses).map(([contactId, { contactName, avatar, statuses }]) => (
            <li key={contactId}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer',
                backgroundColor: selectedContact === contactId ? '#f0f0f0' : 'transparent',
                borderRight: selectedContact === contactId ? '4px solid #00a884' : 'none'
              }}
              onClick={() => { setSelectedContact(contactId); setCurrentIndex(0); }}>
              <img src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=random`} alt={contactName} style={{ width: 48, height: 48, borderRadius: '50%', marginLeft: 16, border: '2.5px solid #25d366' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 17 }}>{contactName}</div>
                <div style={{ fontSize: 13, color: '#666' }}>היום, 10:30</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* תצוגת הסטטוס המרכזית */}
      {selectedContact && (
        <div style={statusViewerStyle}>
          <div style={statusBoxStyle}>
            {renderProgressBars()}
            {/* FIX: This button now closes only the viewer, not the component */}
            <button onClick={handleCloseViewer} style={{
              position: 'absolute', top: 15, right: 20,
              background: 'none', color: '#fff', border: 'none', fontSize: 30,
              cursor: 'pointer', zIndex: 11
            }}>✕</button>

            <div style={{ position: 'absolute', top: 50, right: 20, display: 'flex', alignItems: 'center', zIndex: 10 }}>
              <img src={groupedStatuses[selectedContact].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupedStatuses[selectedContact].contactName)}&background=random`} alt="" style={{ width: 40, height: 40, borderRadius: '50%', marginLeft: 12 }} />
              <span style={{ fontWeight: 'bold', fontSize: 17 }}>{groupedStatuses[selectedContact].contactName}</span>
            </div>

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
