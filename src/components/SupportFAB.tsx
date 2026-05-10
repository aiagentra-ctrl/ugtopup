import { useState } from "react";
import { MessageCircle, X, Plus } from "lucide-react";

/**
 * Floating support stack: Messenger + WhatsApp.
 * Replaces the AI chatbot widget. Tap the toggle to expand/collapse.
 */
export const SupportFAB = () => {
  const [open, setOpen] = useState(false);

  const messengerUrl = "https://m.me/ugtopups"; // update to your FB Page handle if different
  const whatsappUrl = "https://wa.me/9779708562001";

  return (
    <div className="fixed bottom-5 right-4 z-[9998] flex flex-col items-end gap-3">
      {/* Messenger */}
      <a
        href={messengerUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on Messenger"
        className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110
          ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        style={{ backgroundColor: "#0084FF" }}
      >
        <MessageCircle className="h-6 w-6 text-white" fill="white" strokeWidth={0} />
      </a>

      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 delay-75
          ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        style={{ backgroundColor: "#25D366" }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>

      {/* Toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close support" : "Open support"}
        className="h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110"
        style={{ backgroundColor: open ? "#9b87f5" : "#7c3aed" }}
      >
        {open ? (
          <X className="h-7 w-7 text-white" />
        ) : (
          <Plus className="h-7 w-7 text-white" />
        )}
      </button>
    </div>
  );
};
