/**
 * Server component — renders a blocking <script> that applies the saved
 * theme class BEFORE React hydrates, preventing any flash.
 * Must NOT have 'use client'.
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('fichus-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`,
      }}
    />
  );
}
