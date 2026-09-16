export default function AdminLoading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-200 border-t-gold-600 dark:border-plum-800 dark:border-t-gold-500"></div>
        <p className="text-sm font-medium text-gold-600 dark:text-gold-400">Loading data...</p>
      </div>
    </div>
  );
}
