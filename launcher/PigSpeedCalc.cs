using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

static class PigSpeedCalc
{
    [STAThread]
    static void Main()
    {
        string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PigSpeedCalc");
        Directory.CreateDirectory(dir);
        string page = Path.Combine(dir, "index.html");
        using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream("index.html"))
        using (FileStream f = File.Create(page))
            s.CopyTo(f);

        string url = new Uri(page).AbsoluteUri;
        string profile = Path.Combine(dir, "profile");
        string[] browsers = {
            @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            @"C:\Program Files\Google\Chrome\Application\chrome.exe",
            @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
        };
        foreach (string b in browsers)
        {
            if (!File.Exists(b)) continue;
            Process.Start(b, "--app=\"" + url + "\" --user-data-dir=\"" + profile + "\" --window-size=1150,900 --no-first-run --no-default-browser-check");
            return;
        }
        Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
    }
}
