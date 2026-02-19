import React, { useEffect, useState } from "react";
import { fetchStatuses } from "../../services/api.service";
import { getDocumentDirection } from "../../utils/direction";

const StatusViewer = ({ onClose }) => {
  const [groupedStatuses, setGroupedStatuses] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [readStatusIds, setReadStatusIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("readStatusIds") || "{}");
    } catch {
      return {};
    }
  });

  const getContactId = (status) =>
    status.contactId || status.from || status.id || `unknown-${status.id}`;

  const getNameFromId = (id) =>
    (id || "").replace(/@(c\.us|s\.whatsapp\.net)$/, "") || "Unknown contact";

  const getContactName = (status, fallbackId) => {
    const name = status.contactName;
    if (name && name.trim()) return name.trim();
    return getNameFromId(fallbackId);
  };

  const getAvatar = (status) => status.contactAvatar || status.avatarUrl || null;

  useEffect(() => {
    fetchStatuses().then((res) => {
      const data = res.data || [];
      const grouped = {};

      data.forEach((status) => {
        const contactId = getContactId(status);
        const contactName = getContactName(status, contactId);
        const avatar = getAvatar(status);

        if (!grouped[contactId]) {
          grouped[contactId] = {
            contactName,
            avatar,
            statuses: [],
            lastTimestamp: status.timestamp || null,
          };
        }

        grouped[contactId].contactName =
          grouped[contactId].contactName || contactName;
        grouped[contactId].avatar = grouped[contactId].avatar || avatar;
        grouped[contactId].statuses.push(status);

        if (
          status.timestamp &&
          (!grouped[contactId].lastTimestamp ||
            status.timestamp > grouped[contactId].lastTimestamp)
        ) {
          grouped[contactId].lastTimestamp = status.timestamp;
        }
      });

      setGroupedStatuses(grouped);
    });
  }, []);

  useEffect(() => {
    const isVideo =
      selectedContact &&
      groupedStatuses[selectedContact]?.statuses[currentIndex]?.type === "video";
    if (selectedContact && !isVideo) {
      const timer = setTimeout(() => handleNext(), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, selectedContact]);

  useEffect(() => {
    if (selectedContact && groupedStatuses[selectedContact]) {
      const statuses = groupedStatuses[selectedContact].statuses;
      const firstUnreadIdx = statuses.findIndex(
        (s) => !(readStatusIds[selectedContact] || []).includes(s.id)
      );
      setCurrentIndex(firstUnreadIdx !== -1 ? firstUnreadIdx : 0);
    }
    // eslint-disable-next-line
  }, [selectedContact, groupedStatuses]);

  useEffect(() => {
    if (selectedContact && groupedStatuses[selectedContact]) {
      const status = groupedStatuses[selectedContact].statuses[currentIndex];
      if (status && !(readStatusIds[selectedContact] || []).includes(status.id)) {
        const updated = {
          ...readStatusIds,
          [selectedContact]: [
            ...(readStatusIds[selectedContact] || []),
            status.id,
          ],
        };
        setReadStatusIds(updated);
        localStorage.setItem("readStatusIds", JSON.stringify(updated));
      }
    }
    // eslint-disable-next-line
  }, [currentIndex, selectedContact, groupedStatuses]);

  const documentDirection = getDocumentDirection();

  const mainContainerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    direction: documentDirection,
    backgroundColor: "var(--main-bg, #eef0f1)",
    zIndex: 2000,
  };

  const statusViewerStyle = {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--viewer-bg, #111b21)",
    position: "relative",
    height: "100%",
  };

  const sidebarStyle = {
    width: 350,
    background: "var(--sidebar-bg, #fff)",
    borderLeft: "1px solid var(--sidebar-border, #e0e0e0)",
    height: "100vh",
    overflowY: "auto",
  };

  const statusBoxStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    color: "var(--status-text, #fff)",
    position: "relative",
  };

  const handleCloseViewer = () => setSelectedContact(null);

  const formatTimestamp = (unixTs) => {
    if (!unixTs) return "";
    const date = new Date(unixTs * 1000);
    const now = new Date();
    const isSameDay = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (isSameDay) return `Today, ${timeStr}`;
    if (isYesterday) return `Yesterday, ${timeStr}`;
    const dateStr = date.toLocaleDateString();
    return `${dateStr}, ${timeStr}`;
  };

  const handleNext = () => {
    if (!selectedContact) return;
    const contactStatuses = groupedStatuses[selectedContact].statuses;
    if (currentIndex < contactStatuses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleCloseViewer();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentStatus = selectedContact
    ? groupedStatuses[selectedContact]?.statuses?.[currentIndex]
    : null;

  const renderStatusContent = (status) => {
    if (!status) return null;

    if (status.mediaUrl) {
      if (status.type === "image") {
        return (
          <div>
            <img
              src={status.mediaUrl}
              alt="status"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: 8,
                objectFit: "contain",
              }}
            />
            <p>{status.body}</p>
          </div>
        );
      }
      if (status.type === "video") {
        return (
          <div>
            <video
              key={status.id}
              src={status.mediaUrl}
              autoPlay
              onEnded={handleNext}
              style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 8 }}
            />
            <p>{status.body}</p>
          </div>
        );
      }
    }

    if (status.type === "chat") {
      return (
        <div
          style={{
            marginTop: 16,
            fontSize: 24,
            padding: "40px 20px",
            backgroundColor: "#384953",
            borderRadius: 8,
            minWidth: "300px",
            maxWidth: "500px",
          }}
        >
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
      <div
        style={{
          position: "absolute",
          top: 20,
          width: "95%",
          display: "flex",
          gap: "4px",
          zIndex: 10,
        }}
      >
        {contactData.statuses.map((_, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              height: "3px",
              borderRadius: "2px",
              background: index <= currentIndex ? "#fff" : "rgba(255,255,255,0.4)",
              transition: "background 0.3s linear",
            }}
          ></div>
        ))}
      </div>
    );
  };

  const renderHeader = () => {
    const entry = groupedStatuses[selectedContact];
    if (!entry) return null;
    const name = entry.contactName || getNameFromId(selectedContact);
    return (
      <div
        style={{
          position: "absolute",
          top: 50,
          right: 20,
          display: "flex",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <img
          src={
            entry.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
          }
          alt=""
          style={{ width: 40, height: 40, borderRadius: "50%", marginLeft: 12 }}
        />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontWeight: "bold", fontSize: 17 }}>{name}</span>
          <div style={{ fontSize: 13, color: "#ccc", marginTop: 4 }}>
            {currentStatus?.timestamp
              ? formatTimestamp(currentStatus.timestamp)
              : formatTimestamp(entry.lastTimestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={mainContainerStyle}>
      <div style={sidebarStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 16px 8px 16px",
            borderBottom: "1px solid var(--sidebar-border, #eee)",
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: 22 }}>סטטוסים</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "var(--sidebar-close, #555)",
            }}
          >
            ✕
          </button>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {Object.entries(groupedStatuses).map(
            ([contactId, { contactName, avatar, statuses }]) => {
              const unreadCount = statuses.filter(
                (s) => !(readStatusIds[contactId] || []).includes(s.id)
              ).length;
              const nameToShow = contactName || getNameFromId(contactId);
              return (
                <li
                  key={contactId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedContact === contactId ? "#f0f0f0" : "transparent",
                    borderRight:
                      selectedContact === contactId ? "4px solid #00a884" : "none",
                  }}
                  onClick={() => {
                    setSelectedContact(contactId);
                    setCurrentIndex(0);
                  }}
                >
                  <img
                    src={
                      avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        nameToShow
                      )}&background=random`
                    }
                    alt={nameToShow}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      marginLeft: 16,
                      border: "2.5px solid #25d366",
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 17 }}>
                      {nameToShow}
                      {unreadCount > 0 && (
                        <span
                          style={{
                            background: "#25d366",
                            color: "#fff",
                            borderRadius: "50%",
                            padding: "2px 8px",
                            fontSize: 13,
                            marginRight: 8,
                            marginLeft: 4,
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      {groupedStatuses[contactId] &&
                      groupedStatuses[contactId].lastTimestamp
                        ? formatTimestamp(groupedStatuses[contactId].lastTimestamp)
                        : ""}
                    </div>
                  </div>
                </li>
              );
            }
          )}
        </ul>
      </div>

      {selectedContact && (
        <div style={statusViewerStyle}>
          <div style={statusBoxStyle}>
            <button
              onClick={handleCloseViewer}
              style={{
                position: "absolute",
                top: 15,
                right: 20,
                background: "none",
                color: "#fff",
                border: "none",
                fontSize: 30,
                cursor: "pointer",
                zIndex: 11,
              }}
            >
              ✕
            </button>

            {renderHeader()}
            {renderProgressBars()}
            {renderStatusContent(
              groupedStatuses[selectedContact].statuses[currentIndex]
            )}

            <div
              onClick={handleNext}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: "50%",
                zIndex: 2,
                cursor: "pointer",
              }}
            ></div>
            <div
              onClick={handlePrev}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "50%",
                zIndex: 2,
                cursor: "pointer",
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusViewer;
