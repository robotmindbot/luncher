# Android permissions

Luncher requests only the permissions used by its launcher and optional calendar features.

## Installed app discovery

`QUERY_ALL_PACKAGES` lets Luncher find launchable apps so it can display and search them. This is required for the app's core launcher function.

## Calendar access

`READ_CALENDAR` is optional. Luncher asks for it when the user enables the next calendar appointment setting. Denying it leaves the launcher and app search usable; the appointment line stays empty.
