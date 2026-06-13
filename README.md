# VisionHmi

Giao diện HMI viết bằng WPF cho một dây chuyền lắp ráp có kiểm tra hình ảnh và truy
xuất nguồn gốc bằng mã vạch. Phần mềm kết nối tới PLC Siemens S7 qua mạng để hiển thị
trạng thái máy, kết quả kiểm tra, cảnh báo và sản lượng theo thời gian thực. Người vận
hành chạy hoặc dừng dây chuyền, jog từng trạm và đổi công thức ngay trên giao diện.

## Công nghệ

- .NET 10, WPF
- MVVM với CommunityToolkit.Mvvm
- S7netplus để giao tiếp S7
- Serilog để ghi log
- Microsoft.Extensions.DependencyInjection

## Kết nối PLC

HMI giao tiếp với PLC qua giao thức S7 (ISO-on-TCP, cổng 102). Cấu hình kết nối nằm
trong `Plc/PlcConnection.cs` (mặc định 127.0.0.1, CPU S7-1500, rack 0, slot 1). Mọi thao
tác đọc ghi chạy trên một luồng nền riêng, nên giao diện không bị treo kể cả khi đường
truyền chậm hoặc rớt.

Dữ liệu trao đổi qua năm khối DB:

- DB10 Command (HMI gửi xuống PLC)
- DB11 Status (PLC gửi lên HMI)
- DB12 Recipe
- DB13 KPI
- DB14 Alarm

## Các màn hình

- Overview: trạng thái và lệnh PackML, tám trạm, chỉ số sản xuất (good, reject,
  first-pass yield, throughput).
- Inspection: kết quả đọc mã vạch, vision pass/fail kèm số đo, khắc và verify, serial
  của sản phẩm đang chạy.
- Alarms: danh sách cảnh báo đang hoạt động kèm mức ưu tiên và trạm.
- Recipe: chỉnh setpoint và tải xuống PLC.

## Cấu trúc thư mục

```
Plc/         kết nối S7, giải mã và mã hoá byte, worker nền
ViewModels/  mỗi màn một view model, kèm view model trạm dùng chung
Views/       XAML từng màn và cửa sổ chính
Resources/   theme, style, converter
Generated/   PlcTags.g.cs, bản đồ địa chỉ tag (tự sinh, không sửa tay)
Converters/  các value converter
```

## Build và chạy

.NET 10 SDK.

```
dotnet build
dotnet run
```

Hoặc chạy file thực thi trong `bin/Debug/<tfm>/win-x64/VisionHmi.exe`. Khi khởi động,
HMI tự kết nối PLC và bắt đầu đọc dữ liệu. Để chạy dây chuyền, chọn chế độ PRODUCTION
rồi bấm RESET, sau đó START.

## Ghi log

Log được ghi ra console và ra file theo ngày trong thư mục `logs` (`hmi-YYYYMMDD.log`)
bằng Serilog. Các sự kiện kết nối, lệnh của người vận hành và lỗi đều được ghi lại.

## Bản đồ tag

File `Generated/PlcTags.g.cs` chứa địa chỉ S7 của mọi tag (khối DB, byte, bit, kiểu).
File này tự sinh từ danh sách tag của dây chuyền nên không sửa tay. Khi danh sách tag
thay đổi thì sinh lại file.

## Ghi chú

- HMI đọc STATUS, RECIPE, KPI và ALARM mỗi vòng quét, chỉ ghi COMMAND và RECIPE khi
  người vận hành thao tác.
- Các chỉnh sửa công thức chỉ nằm ở máy tới khi bấm Download.
