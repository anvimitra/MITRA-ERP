using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Diagnostics;

namespace Anvimitra.DesktopSyncAgent
{
    class Program
    {
        private static string erpUrl = "http://localhost:4000";
        private static string schoolCode = "LSK01";
        private static string schoolName = "LSK Academy";
        private static string apiSyncKey = "ANVI_SYNC_LSK01_SECRET_KEY_5566";
        private static int localPort = 5432;
        private static string baseDir = "";
        private static string localStorageDir = "";
        private static string lastSyncTimestamp = "Never";
        private static int totalSyncedRecords = 0;
        private static Timer autoSyncTimer;
        private static bool autoSyncEnabled = true;

        static void Main(string[] args)
        {
            Console.Title = "ANVIMITRA-ERP Secondary Database Sync Agent (.EXE)";
            baseDir = AppDomain.CurrentDomain.BaseDirectory;
            
            // Resolve local-storage directory relative to exe or parent packages directory
            localStorageDir = Path.Combine(baseDir, "local-storage");
            if (!Directory.Exists(localStorageDir))
            {
                string parentStorage = Path.Combine(baseDir, "..", "local-storage");
                if (Directory.Exists(parentStorage))
                {
                    localStorageDir = Path.GetFullPath(parentStorage);
                }
                else
                {
                    Directory.CreateDirectory(localStorageDir);
                }
            }

            // Parse any command line args
            if (args.Length > 0 && !string.IsNullOrEmpty(args[0])) schoolCode = args[0];
            if (args.Length > 1 && !string.IsNullOrEmpty(args[1])) apiSyncKey = args[1];

            PrintBanner();

            // Perform initial connection test & sync pull
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("[*] Starting initial synchronization with Cloud ERP...");
            Console.ResetColor();
            PerformSyncPull();

            // Start background 60-second periodic sync timer
            autoSyncTimer = new Timer(OnTimerTick, null, 60000, 60000);

            // Interactive Command Loop
            bool running = true;
            while (running)
            {
                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.WriteLine("======================= AVAILABLE COMMANDS =======================");
                Console.WriteLine("  1. Trigger Instant Sync Pull from Cloud ERP");
                Console.WriteLine("  2. Open Local Web Dashboard in Browser (http://localhost:5432)");
                Console.WriteLine("  3. View Local Offline Stored Records Summary");
                Console.WriteLine("  4. Switch School Code (LSK01 / DPS01 / STX02)");
                Console.WriteLine("  5. Toggle 60-Sec Auto Sync (Currently: " + (autoSyncEnabled ? "ENABLED" : "DISABLED") + ")");
                Console.WriteLine("  0. Exit Sync Agent");
                Console.WriteLine("==================================================================");
                Console.ResetColor();
                Console.Write("Enter choice [0-5]: ");

                string choice = Console.ReadLine();
                if (choice == null) break;
                choice = choice.Trim();

                switch (choice)
                {
                    case "1":
                        PerformSyncPull();
                        break;
                    case "2":
                        LaunchDashboard();
                        break;
                    case "3":
                        DisplayLocalRecords();
                        break;
                    case "4":
                        SwitchSchool();
                        break;
                    case "5":
                        autoSyncEnabled = !autoSyncEnabled;
                        Console.WriteLine("Auto-sync is now: " + (autoSyncEnabled ? "ENABLED (every 60s)" : "DISABLED"));
                        break;
                    case "0":
                        running = false;
                        Console.WriteLine("Shutting down Secondary Sync Agent. Goodbye.");
                        break;
                    default:
                        Console.WriteLine("Invalid option. Please try again.");
                        break;
                }
            }
        }

        private static void PrintBanner()
        {
            Console.ForegroundColor = ConsoleColor.Magenta;
            Console.WriteLine(@"
   ╔═══════════════════════════════════════════════════════════════════╗
   ║       ANVIMITRA-ERP SECONDARY DATABASE SYNC AGENT (.EXE)          ║
   ║         Windows PC Local Storage Engine & Offline Backup          ║
   ╚═══════════════════════════════════════════════════════════════════╝");
            Console.ResetColor();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("  • Target School Tenant : " + schoolName + " (" + schoolCode + ")");
            Console.WriteLine("  • Cloud ERP Endpoint   : " + erpUrl);
            Console.WriteLine("  • Local Storage Path   : " + localStorageDir);
            Console.WriteLine("  • Sync Authorization   : API Key Authenticated");
            Console.ResetColor();
            Console.WriteLine("-------------------------------------------------------------------");
        }

        private static void OnTimerTick(object state)
        {
            if (autoSyncEnabled)
            {
                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.DarkGray;
                Console.WriteLine("[Auto-Sync Timer] Checking Cloud ERP for delta updates at " + DateTime.Now.ToString("HH:mm:ss") + "...");
                Console.ResetColor();
                PerformSyncPull(true);
            }
        }

        private static void PerformSyncPull(bool silent = false)
        {
            try
            {
                string syncPullEndpoint = erpUrl + "/api/sync/pull";
                string postJson = "{\"schoolCode\":\"" + schoolCode + "\",\"apiSyncKey\":\"" + apiSyncKey + "\",\"deviceIdentifier\":\"WIN-PC-SECONDARY-STORAGE\"}";

                byte[] postBytes = Encoding.UTF8.GetBytes(postJson);

                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(syncPullEndpoint);
                request.Method = "POST";
                request.ContentType = "application/json";
                request.ContentLength = postBytes.Length;
                request.Timeout = 8000;

                using (Stream requestStream = request.GetRequestStream())
                {
                    requestStream.Write(postBytes, 0, postBytes.Length);
                }

                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                using (StreamReader reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8))
                {
                    string jsonResponse = reader.ReadToEnd();
                    lastSyncTimestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

                    // Save downloaded snapshot directly into local-storage
                    string backupFilePath = Path.Combine(localStorageDir, "lsk_secondary_cloud_snapshot.json");
                    File.WriteAllText(backupFilePath, jsonResponse);

                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[+] SYNC SUCCESS! Data pulled from Cloud ERP at " + lastSyncTimestamp);
                    Console.WriteLine("    Stored in: " + backupFilePath);
                    Console.ResetColor();
                }
            }
            catch (Exception ex)
            {
                if (!silent)
                {
                    Console.ForegroundColor = ConsoleColor.DarkYellow;
                    Console.WriteLine("[!] Cloud ERP offline or unreached (" + ex.Message + ")");
                    Console.WriteLine("    Operating in Local PC Offline Standby Mode.");
                    Console.ResetColor();
                }
            }
        }

        private static void LaunchDashboard()
        {
            string url = "http://localhost:" + localPort;
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
                Console.WriteLine("Opened Web Dashboard in default browser: " + url);
            }
            catch
            {
                Console.WriteLine("Please open: " + url + " in your browser.");
            }
        }

        private static void DisplayLocalRecords()
        {
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("--- LOCAL PC SECONDARY DATABASE SUMMARY ---");
            Console.WriteLine("School Code        : " + schoolCode);
            Console.WriteLine("Last Sync Timestamp: " + lastSyncTimestamp);
            Console.WriteLine("Storage Directory  : " + localStorageDir);

            string snapshot = Path.Combine(localStorageDir, "lsk_secondary_cloud_snapshot.json");
            if (File.Exists(snapshot))
            {
                FileInfo fi = new FileInfo(snapshot);
                Console.WriteLine("Snapshot File Size : " + (fi.Length / 1024.0).ToString("0.00") + " KB");
                Console.WriteLine("Snapshot Updated   : " + fi.LastWriteTime.ToString());
            }
            else
            {
                Console.WriteLine("Snapshot File      : Not downloaded yet (run sync pull first).");
            }
            Console.ResetColor();
        }

        private static void SwitchSchool()
        {
            Console.WriteLine();
            Console.WriteLine("Select School to configure for this PC:");
            Console.WriteLine("  1. LSK01 - LSK Academy (Bhopal)");
            Console.WriteLine("  2. DPS01 - Delhi Public Global Academy (New Delhi)");
            Console.WriteLine("  3. STX02 - St. Xavier International School (Jaipur)");
            Console.Write("Enter selection (1/2/3): ");
            string s = Console.ReadLine();
            if (s == "1")
            {
                schoolCode = "LSK01";
                schoolName = "LSK Academy";
                apiSyncKey = "ANVI_SYNC_LSK01_SECRET_KEY_5566";
            }
            else if (s == "2")
            {
                schoolCode = "DPS01";
                schoolName = "Delhi Public Global Academy";
                apiSyncKey = "ANVI_SYNC_DPS01_SECRET_KEY_9988";
            }
            else if (s == "3")
            {
                schoolCode = "STX02";
                schoolName = "St. Xavier International School";
                apiSyncKey = "ANVI_SYNC_STX02_SECRET_KEY_7744";
            }
            Console.WriteLine("Configured for: " + schoolName + " (" + schoolCode + ")");
            PerformSyncPull();
        }
    }
}
