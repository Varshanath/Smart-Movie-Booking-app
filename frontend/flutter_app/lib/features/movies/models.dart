class Movie {
  Movie({
    required this.id,
    required this.title,
    required this.genre,
    required this.language,
    required this.durationMinutes,
    required this.releaseDate,
  });

  factory Movie.fromJson(Map<String, dynamic> json) {
    return Movie(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      genre: json['genre'] as String? ?? '',
      language: json['language'] as String? ?? '',
      durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 0,
      releaseDate: json['releaseDate'] as String? ?? '',
    );
  }

  final String id;
  final String title;
  final String genre;
  final String language;
  final int durationMinutes;
  final String releaseDate;

  String get durationLabel {
    final hours = durationMinutes ~/ 60;
    final minutes = durationMinutes % 60;
    if (hours == 0) return '${minutes}m';
    return '${hours}h ${minutes}m';
  }
}

class Theatre {
  Theatre({
    required this.id,
    required this.name,
    required this.location,
    required this.locationId,
  });

  factory Theatre.fromJson(Map<String, dynamic> json) {
    return Theatre(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      location: json['location'] as String? ?? '',
      locationId: json['locationId'] as String? ?? '',
    );
  }

  final String id;
  final String name;
  final String location;
  final String locationId;
}

class MovieLocation {
  MovieLocation({required this.id, required this.name});

  factory MovieLocation.fromJson(Map<String, dynamic> json) {
    return MovieLocation(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
    );
  }

  final String id;
  final String name;
}

class Screen {
  Screen({required this.id, required this.theatreId, required this.name});

  factory Screen.fromJson(Map<String, dynamic> json) {
    return Screen(
      id: json['id'] as String? ?? '',
      theatreId: json['theatreId'] as String? ?? '',
      name: json['name'] as String? ?? '',
    );
  }

  final String id;
  final String theatreId;
  final String name;
}

class Show {
  Show({
    required this.id,
    required this.movieId,
    required this.screenId,
    required this.startTime,
    required this.price,
  });

  factory Show.fromJson(Map<String, dynamic> json) {
    return Show(
      id: json['id'] as String? ?? '',
      movieId: json['movieId'] as String? ?? '',
      screenId: json['screenId'] as String? ?? '',
      startTime:
          DateTime.tryParse(json['startTime'] as String? ?? '')?.toLocal() ??
              DateTime.now(),
      price: (json['price'] as num?)?.toInt() ?? 0,
    );
  }

  final String id;
  final String movieId;
  final String screenId;
  final DateTime startTime;
  final int price;
}

class SeatMap {
  SeatMap({
    required this.showId,
    required this.rows,
    required this.seatsPerRow,
    required this.price,
    required this.seatLabels,
    required this.bookedSeats,
  });

  factory SeatMap.fromJson(Map<String, dynamic> json) {
    return SeatMap(
      showId: json['showId'] as String? ?? '',
      rows: (json['rows'] as num?)?.toInt() ?? 0,
      seatsPerRow: (json['seatsPerRow'] as num?)?.toInt() ?? 0,
      price: (json['price'] as num?)?.toInt() ?? 0,
      seatLabels: (json['seatLabels'] as List? ?? [])
          .map((label) => label.toString())
          .toList(),
      bookedSeats: (json['bookedSeats'] as List? ?? [])
          .map((label) => label.toString())
          .toSet(),
    );
  }

  final String showId;
  final int rows;
  final int seatsPerRow;
  final int price;
  final List<String> seatLabels;
  final Set<String> bookedSeats;
}

class BookingRecord {
  BookingRecord({
    required this.id,
    required this.userId,
    required this.showId,
    required this.paymentId,
    required this.seatNumbers,
    required this.status,
    required this.createdAt,
  });

  factory BookingRecord.fromJson(Map<String, dynamic> json) {
    return BookingRecord(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      showId: json['showId'] as String? ?? '',
      paymentId: json['paymentId'] as String? ?? '',
      seatNumbers: (json['seatNumbers'] as List? ?? [])
          .map((seat) => seat.toString())
          .toList(),
      status: json['status'] as String? ?? 'confirmed',
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ??
              DateTime.now(),
    );
  }

  final String id;
  final String userId;
  final String showId;
  final String paymentId;
  final List<String> seatNumbers;
  final String status;
  final DateTime createdAt;
}

class PaymentRecord {
  PaymentRecord({required this.id, required this.amount});

  factory PaymentRecord.fromJson(Map<String, dynamic> json) {
    return PaymentRecord(
      id: json['id'] as String? ?? '',
      amount: (json['amount'] as num?)?.toInt() ?? 0,
    );
  }

  final String id;
  final int amount;
}
