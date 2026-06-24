using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VisionHmi.Data;
using VisionHmi.Stores;

namespace VisionHmi.Services;

/// <summary>Authentication: register + login with BCrypt-hashed passwords.
/// On a successful login the signed-in user is published to the <see cref="AuthStore"/>.</summary>
public sealed class AuthService
{
    private readonly IDbContextFactory<AppDbContext> _dbf;
    private readonly AuthStore _store;

    public AuthService(IDbContextFactory<AppDbContext> dbf, AuthStore store)
    {
        _dbf = dbf;
        _store = store;
    }

    public async Task<(bool ok, string error)> Login(string username, string password)
    {
        await using var db = await _dbf.CreateDbContextAsync();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null) return (false, "Tài khoản không tồn tại");
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) return (false, "Sai mật khẩu");
        _store.CurrentUser = user;
        return (true, "");
    }

    public async Task<(bool ok, string error)> Register(string username, string fullName, string password, string role = "Operator")
    {
        if (string.IsNullOrWhiteSpace(username)) return (false, "Chưa nhập tên đăng nhập");
        if (password is null || password.Length < 4) return (false, "Mật khẩu tối thiểu 4 ký tự");

        await using var db = await _dbf.CreateDbContextAsync();
        if (await db.Users.AnyAsync(u => u.Username == username)) return (false, "Tên đăng nhập đã tồn tại");

        db.Users.Add(new User
        {
            Username = username,
            FullName = fullName,
            Role = role,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
        });
        await db.SaveChangesAsync();
        return (true, "");
    }

    /// <summary>Create the schema if needed and seed a default admin (admin / admin123) once.</summary>
    public async Task EnsureSeededAsync()
    {
        await using var db = await _dbf.CreateDbContextAsync();
        await db.Database.EnsureCreatedAsync();
        if (!await db.Users.AnyAsync())
        {
            db.Users.Add(new User
            {
                Username = "admin",
                FullName = "Administrator",
                Role = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            });
            await db.SaveChangesAsync();
        }
    }
}
