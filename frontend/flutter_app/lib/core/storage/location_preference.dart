/// Remembers the patron's chosen city for the lifetime of the app session.
class LocationPreference {
  LocationPreference._();

  static String? _selectedLocationId;
  static String? _selectedLocationName;

  static String? get selectedLocationId => _selectedLocationId;
  static String? get selectedLocationName => _selectedLocationName;

  static void select(String? id, String? name) {
    _selectedLocationId = id;
    _selectedLocationName = name;
  }
}
