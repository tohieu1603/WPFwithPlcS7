using System;

namespace VisionHmi.Data;

/// <summary>An application user (authentication + role-based access). Stored in the
/// dedicated VisionHmi PostgreSQL database (separate from the MES database).</summary>
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";   // BCrypt hash, never the plain text
    public string FullName { get; set; } = "";
    public string Role { get; set; } = "Operator";    // "Admin" | "Operator"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
