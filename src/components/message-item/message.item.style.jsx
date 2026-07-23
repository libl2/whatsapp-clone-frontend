import styled from "styled-components";
const Wrapper = styled.div`
  padding: 0 64px;
  margin-bottom: 6px;

  .message-conatainer {
    margin-bottom: 0;
    border-radius: 7.5px;
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
    text-align: center;
    padding: 0 12px;
  }

    .media-placeholder.media-failed {
      background-color: #f8e5e5;
      color: #a33;
    }

    .tail-in {
      left: -8px;
      color: var(--incoming-background);
      position: absolute;
      top: 0;
      z-index: 100;
      display: block;
      width: 8px;
      height: 13px;
    }

  .inner {
      max-width: min(65%, 680px);
      position: relative;
      z-index: 200;
      display: flex;

      .sender {
        display: flex;
        font-size: 12.8px;
        font-weight: bold;
        margin-bottom: 4px;
        color: var(--teal-lighter);
      }

        .message {
        background-color: var(--incoming-background);
        box-shadow: 0 1px 0.5px rgba(var(--shadow-rgb), 0.08);
        border-radius: 7.5px;
        border-top-left-radius: 0 !important;
        padding: 6px 7px 8px 9px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: fit-content;

        .quoted-message {
          width: 100%;
          min-width: 180px;
          max-width: 100%;
          box-sizing: border-box;
          margin-bottom: 6px;
          padding: 7px 9px;
          border-radius: 7px;
          border-inline-start: 4px solid #06cf9c;
          background: rgba(17, 27, 33, 0.06);
        }

        .quoted-message.me {
          background: rgba(17, 27, 33, 0.08);
        }

        .quoted-author {
          font-size: 12px;
          line-height: 16px;
          font-weight: 700;
          color: #0a7c66;
          margin-bottom: 2px;
        }

        .quoted-text {
          font-size: 13px;
          line-height: 18px;
          color: var(--message-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-break: break-word;
        }

        &.has-media {
          padding: 3px;

          .text {
            padding: 6px 7px 0 9px;
          }

          .meta {
            padding: 1px 7px 2px 9px;
            margin-top: 2px;
          }
        }

        .media {
          width: min(100%, 336px);
          margin-bottom: 0;
        }
        .media img {
          display: block;
          max-width: 336px;
          width: 100%;
          max-height: 420px;
          border-radius: 6px;
          object-fit: cover;
          background: #eee;
        }
        .media video {
          display: block;
          max-width: 336px;
          width: 100%;
          height: auto;
          aspect-ratio: 16/9;
          border-radius: 6px;
          background: #000;
        }
        .text {
          display: block;
          position: relative;
          overflow-wrap: break-word;
          white-space: pre-wrap;
          font-size: 15px;
          line-height: 20px;
          color: var(--message-primary);
          font-family: Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif;
          max-width: 100%;

          p {
            margin: 0;
          }

          a {
            color: #53bdeb;
            text-decoration: underline;
            text-underline-offset: 2px;
            cursor: pointer;
            word-break: break-all;
          }
        }

        .meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-top: 4px;
          align-self: flex-end;
        }

        .time {
          display: inline-flex;
          margin-inline-start: 8px;
          font-size: 11px;
          opacity: 0.72;
          color: var(--message-secondary);
        }

        .ticks {
          display: inline-flex;
          margin-inline-start: 4px;
          width: 16px;
          height: 16px;
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
