using Microsoft.EntityFrameworkCore;

namespace VisionHmi.Data;

/// <summary>EF Core context for the VisionHmi auth database (PostgreSQL via Npgsql).</summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.Username).HasMaxLength(64);
            e.Property(u => u.FullName).HasMaxLength(128);
            e.Property(u => u.Role).HasMaxLength(16);
        });
    }
}
