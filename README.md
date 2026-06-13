# VisionHmi

WPF HMI for a vision and barcode track-and-trace assembly line. It connects to a
Siemens S7 PLC over the network and shows live machine state, inspection results,
alarms and production counters. Operators start and stop the line, jog stations and
change the recipe from here.

## Stack

- .NET 10, WPF
- MVVM with CommunityToolkit.Mvvm
- S7netplus for S7 communication
- Serilog for logging
- Microsoft.Extensions.DependencyInjection

## How it connects

The HMI talks to the PLC using the S7 protocol (ISO-on-TCP, port 102). Connection
settings live in `Plc/PlcConnection.cs` (default 127.0.0.1, CPU S7-1500, rack 0,
slot 1). All reads and writes run on a dedicated background thread, so the UI keeps
responding even when the link is slow or drops.

Data is exchanged through five data blocks:

- DB10 Command (HMI to PLC)
- DB11 Status (PLC to HMI)
- DB12 Recipe
- DB13 KPI
- DB14 Alarms

## Screens

- Overview: PackML state and commands, the eight stations, and KPI (good, reject,
  first-pass yield, throughput).
- Inspection: live barcode read, vision pass/fail with measurements, mark and verify,
  and the current unit serial.
- Alarms: active alarms with priority and station.
- Recipe: edit setpoints and download them to the PLC.

## Project layout

```
Plc/         S7 link, byte decode/encode, background worker
ViewModels/  one per screen, plus a shared station view model
Views/       XAML for each screen and the shell window
Resources/   theme, styles, converters
Generated/   PlcTags.g.cs, the tag address map (generated, do not edit)
Converters/  value converters
```

## Build and run

Requires the .NET 10 SDK.

```
dotnet build
dotnet run
```

You can also run the built executable from `bin/Debug/<tfm>/win-x64/VisionHmi.exe`.
On start the HMI connects to the PLC and begins polling. To run the line, set the mode
to PRODUCTION and press RESET, then START.

## Logging

Logs are written to the console and to a daily file under `logs/` (`hmi-YYYYMMDD.log`)
using Serilog. Connection events, operator commands and errors are recorded.

## Tag map

`Generated/PlcTags.g.cs` holds the S7 address of every tag (data block, byte, bit and
type). It is generated from the line tag list, so do not edit it by hand. Regenerate it
when the tag list changes.

## Notes

- The HMI reads STATUS, RECIPE, KPI and ALARM every scan, and writes COMMAND and RECIPE
  only when the operator acts.
- Recipe edits stay local until you press Download.
