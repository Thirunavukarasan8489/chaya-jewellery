declare global {
  type PageProps<T extends string = string> = {
    params: Promise<Record<string, string>>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  };

  type LayoutProps<T extends string = string> = {
    children: React.ReactNode;
    params?: Promise<Record<string, string>>;
  };
}

export {};
