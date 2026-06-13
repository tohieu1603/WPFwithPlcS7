# VisionHmi + MES

Hệ thống gồm hai phần làm việc cùng nhau cho một dây chuyền lắp ráp có kiểm tra hình
ảnh và truy xuất nguồn gốc bằng mã vạch:

- VisionHmi: giao diện HMI viết bằng WPF (.NET 10). Kết nối tới PLC Siemens S7 để giám
  sát và điều khiển dây chuyền, đồng thời đẩy dữ liệu sản xuất lên MES.
- mes: hệ thống MES trên web. Backend nhận dữ liệu từ HMI và lưu trữ; frontend hiển thị
  dashboard, sản lượng, chất lượng và truy xuất nguồn gốc theo thời gian thực.

## Luồng dữ liệu

```
HMI  <->  PLC S7        (đọc trạng thái, ghi lệnh)
HMI   ->  MES backend   (đẩy trạng thái, KPI, bản ghi truy xuất, cảnh báo)
MES backend -> MES web  (hiển thị real-time)
```

## Công nghệ

HMI
- .NET 10, WPF, MVVM (CommunityToolkit.Mvvm)
- S7netplus (giao tiếp S7)
- Serilog (ghi log)

MES backend
- Express, TypeScript, TypeORM
- SQLite (không cần cài server cơ sở dữ liệu)

MES frontend
- Next.js 16, React 19
- Ant Design, TanStack Query
- React Flow (sơ đồ dây chuyền), Recharts (biểu đồ)

## Cấu trúc thư mục

```
VisionHmi/
  Plc/         kết nối S7, giải mã byte, worker chạy nền
  Services/    MesReporter - đẩy dữ liệu lên MES
  ViewModels/  Views/  Resources/  Generated/
  mes/
    backend/   Express + TypeORM, REST API
    frontend/  Next.js + Ant Design, giao diện web
```

## Yêu cầu

- .NET 10 SDK
- Node.js 20 trở lên
- Một PLC Siemens S7. HMI mặc định kết nối 127.0.0.1, rack 0, slot 1, CPU S7-1500;
  chỉnh trong `Plc/PlcConnection.cs`.

## Chạy dự án

Mở ba terminal.

1. MES backend
```
cd mes/backend
npm install
npm start
```
Backend chạy ở http://localhost:4000

2. MES frontend
```
cd mes/frontend
npm install
npm run dev
```
Mở http://localhost:3000

3. HMI
```
dotnet build
dotnet run
```
HMI tự kết nối PLC, bắt đầu giám sát và đẩy dữ liệu lên MES. Trên HMI chọn chế độ
PRODUCTION rồi bấm RESET, sau đó START để chạy dây chuyền.

## Các màn hình MES (web)

- Dashboard: trạng thái máy, OEE, sơ đồ dây chuyền (process flow), biểu đồ sản lượng và
  năng suất.
- Stations: sơ đồ thiết bị tương tác, chi tiết từng trạm, phát hiện điểm nghẽn.
- Quality: xu hướng điểm vision, biểu đồ SPC kích thước, phân bố hạng in mã.
- Production Records: bảng truy xuất nguồn gốc, xem chi tiết từng sản phẩm, xuất CSV.
- Alarms: danh sách cảnh báo theo mức ưu tiên.
- Recipes: quản lý công thức sản phẩm.

## Ghi log

HMI ghi log bằng Serilog ra thư mục `logs` theo ngày. MES backend in log ra console.
