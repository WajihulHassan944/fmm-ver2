import { useEffect } from "react";

const runWhenIdle = (callback) => {
  if (typeof window === "undefined") return undefined;

  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout: 6000 });
    return () => window.cancelIdleCallback?.(id);
  }

  const id = window.setTimeout(callback, 3500);
  return () => window.clearTimeout(id);
};

const ChatbaseWidget = () => {
  useEffect(() => {
    let cleanupIdle;
    let scriptElement;

    const installChatbase = () => {
      if (!window.chatbase || window.chatbase("getState") !== "initialized") {
        window.chatbase = (...args) => {
          if (!window.chatbase.q) window.chatbase.q = [];
          window.chatbase.q.push(args);
        };
        window.chatbase = new Proxy(window.chatbase, {
          get(target, prop) {
            if (prop === "q") return target.q;
            return (...args) => target(prop, ...args);
          },
        });

        scriptElement = document.createElement("script");
        scriptElement.src = "https://www.chatbase.co/embed.min.js";
        scriptElement.id = "4ke2srJtbF4_VgZJrMeiM";
        scriptElement.domain = "www.chatbase.co";
        scriptElement.async = true;
        document.body.appendChild(scriptElement);
      }
    };

    const scheduleInstall = () => {
      cleanupIdle = runWhenIdle(installChatbase);
    };

    if (document.readyState === "complete") {
      scheduleInstall();
    } else {
      window.addEventListener("load", scheduleInstall, { once: true });
    }

    return () => {
      window.removeEventListener("load", scheduleInstall);
      cleanupIdle?.();
      scriptElement?.remove?.();
    };
  }, []);

  return null;
};

export default ChatbaseWidget;
