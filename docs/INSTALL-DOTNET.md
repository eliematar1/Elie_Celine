# Install .NET 8 SDK (required for ASP.NET Core API)

Week 2 requires the **ASP.NET Core** backend. Install once:

1. Download: https://dotnet.microsoft.com/download/dotnet/8.0  
2. Install **.NET 8.0 SDK** (not Runtime only)  
3. **Restart** VS Code / terminal  
4. Verify:
   ```powershell
   dotnet --list-sdks
   ```
   Should show `8.0.xxx`

5. Run API:
   ```powershell
   cd src\ITHelpDesk.API
   dotnet restore
   dotnet run
   ```

## Until SDK is installed

Use the Node fallback (same API routes):

```powershell
cd api-dev-server
npm install
node server.js
```

## SQL Server Express

1. Install SQL Server Express + SSMS  
2. Run `database\ITHelpDesk-COMPLETE.sql`  
3. Set `UseInMemoryDatabase: false` in `appsettings.Development.json`  
4. Use connection string for `(localdb)\mssqllocaldb` or your instance name
