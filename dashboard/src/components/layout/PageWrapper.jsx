import Sidebar from "./Sidebar.jsx";

/** Wraps all protected dashboard pages with the sidebar layout. */
export default function PageWrapper({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1117]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
