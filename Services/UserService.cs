using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VisionHmi.Data;

namespace VisionHmi.Services;

/// <summary>CRUD operations on users for the admin "Users" screen.</summary>
public sealed class UserService
{
    private readonly IDbContextFactory<AppDbContext> _dbf;

    public UserService(IDbContextFactory<AppDbContext> dbf) => _dbf = dbf;

    public async Task<List<User>> GetAll()
    {
        await using var db = await _dbf.CreateDbContextAsync();
        return await db.Users.OrderBy(u => u.Id).ToListAsync();
    }

    public async Task<(bool ok, string error)> Create(string username, string fullName, string password, string role)
    {
        if (string.IsNullOrWhiteSpace(username)) return (false, "Chưa nhập tên đăng nhập");
        if (string.IsNullOrEmpty(password)) return (false, "Chưa nhập mật khẩu");

        await using var db = await _dbf.CreateDbContextAsync();
        if (await db.Users.AnyAsync(u => u.Username == username)) return (false, "Trùng tên đăng nhập");

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

    /// <summary>Update full name + role; only resets the password when <paramref name="newPassword"/> is non-empty.</summary>
    public async Task<(bool ok, string error)> Update(int id, string fullName, string role, string? newPassword)
    {
        await using var db = await _dbf.CreateDbContextAsync();
        var u = await db.Users.FindAsync(id);
        if (u is null) return (false, "Không tìm thấy người dùng");

        u.FullName = fullName;
        u.Role = role;
        if (!string.IsNullOrEmpty(newPassword)) u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await db.SaveChangesAsync();
        return (true, "");
    }

    public async Task<(bool ok, string error)> Delete(int id)
    {
        await using var db = await _dbf.CreateDbContextAsync();
        var u = await db.Users.FindAsync(id);
        if (u is null) return (false, "Không tìm thấy người dùng");

        db.Users.Remove(u);
        await db.SaveChangesAsync();
        return (true, "");
    }
}
