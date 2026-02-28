import styled from "styled-components";
const Wrapper = styled.div`
  padding: 0 64px;
  margin-bottom: 6px;

  .message-conatainer {
    margin-bottom: 0;
    border-radius: 8px;
    position: relative;
    flex: none;
    font-size: 15px;
    line-height: 20px;
    color: var(--message-primary);
    display: flex;
    flex-direction: column;
    border-top-left-radius: 0 !important;

    .media-placeholder {
    width: 220px;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e5e5e5;
    border-radius: 8px;
    color: #888;
    font-size: 16px;
    margin-bottom: 6px;
  }

    .tail-in {
      left: -8px;
      color: var(--incoming-background);
      position: absolute;
      top: -2px;
      z-index: 100;
      display: block;
      width: 8px;
      height: 13px;
    }

  .inner {
      max-width: min(72%, 680px);
      position: relative;
      z-index: 200;
      display: flex;

      .sender {
        display: flex;
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 4px;
      }

        .message {
        background-color: var(--incoming-background);
        box-shadow: 0 1px 0.5px rgba(var(--shadow-rgb), 0.08);
        border-radius: 8px;
        border-top-left-radius: 0 !important;
        padding-left: 12px;
        padding-right: 12px;
        padding-bottom: 8px;
        padding-top: 8px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: flex-start;

        .media {
          width: 100%;
          margin-bottom: 8px;
        }
        .media img {
          display: block;
          max-width: 420px;
          width: 100%;
          max-height: 420px;
          border-radius: 12px;
          object-fit: cover;
          margin-bottom: 8px;
          background: #eee;
        }
        .media video {
          display: block;
          max-width: 420px;
          width: 100%;
          height: auto;
          aspect-ratio: 16/9;
          border-radius: 12px;
          margin-bottom: 8px;
          background: #000;
        }
        .text {
          display: block;
          position: relative;
          overflow-wrap: break-word;
          white-space: pre-wrap;
          font-size: 14.2px;
          line-height: 1.45;
          color: var(--message-primary);
          font-family: Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif;

          p {
            margin: 0;
          }
        }

        .meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-top: 6px;
        }

        .time {
          display: inline-flex;
          margin-inline-start: 10px;
          font-size: 11px;
          opacity: 0.85;
          color: var(--message-secondary);
        }

        .ticks {
          display: inline-flex;
          margin-inline-start: 6px;
          width: 18px;
          height: 18px;
          color: var(--message-secondary);
        }
      }
    }

    &.me {
      align-items: flex-end;

      .tail-in {
        right: -8px;
        left: unset;
        color: var(--outgoing-background) !important;
      }
        .message {
        border-top-left-radius: 7.5px !important;
        border-top-right-radius: 0 !important;
        background-color: var(--outgoing-background) !important;
        box-shadow: 0 1px 0.5px rgba(var(--shadow-rgb), 0.13) !important;
        .time { color: var(--message-secondary); }
        .ticks { color: var(--message-secondary); }
      }
    }
  }
`;

export default Wrapper;
