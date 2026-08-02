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

class UserSummary {
  UserSummary({
    required this.id,
    required this.name,
    required this.email,
    required this.moviePreference,
  });

  factory UserSummary.fromJson(Map<String, dynamic> json) {
    return UserSummary(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      moviePreference: (json['moviePreference'] as List? ?? [])
          .map((genre) => genre.toString())
          .toList(),
    );
  }

  final String id;
  final String name;
  final String email;
  final List<String> moviePreference;
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

class Review {
  Review({
    required this.id,
    required this.userId,
    required this.movieId,
    required this.rating,
    required this.reviewText,
    required this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      movieId: json['movieId'] as String? ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewText: json['reviewText'] as String? ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ??
              DateTime.now(),
    );
  }

  final String id;
  final String userId;
  final String movieId;
  final double rating;
  final String reviewText;
  final DateTime createdAt;
}

class WatchlistItem {
  WatchlistItem({
    required this.id,
    required this.userId,
    required this.movieId,
    required this.createdAt,
  });

  factory WatchlistItem.fromJson(Map<String, dynamic> json) {
    return WatchlistItem(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      movieId: json['movieId'] as String? ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ??
              DateTime.now(),
    );
  }

  final String id;
  final String userId;
  final String movieId;
  final DateTime createdAt;
}

class Recommendation {
  Recommendation({
    required this.id,
    required this.userId,
    required this.movieId,
    required this.rank,
    required this.reason,
  });

  factory Recommendation.fromJson(Map<String, dynamic> json) {
    return Recommendation(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      movieId: json['movieId'] as String? ?? '',
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      reason: json['reason'] as String? ?? '',
    );
  }

  final String id;
  final String userId;
  final String movieId;
  final int rank;
  final String reason;
}

class AppNotification {
  AppNotification({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      type: json['type'] as String? ?? '',
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      isRead: json['isRead'] as bool? ?? false,
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ??
              DateTime.now(),
    );
  }

  final String id;
  final String userId;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final DateTime createdAt;
}

class SearchHistoryEntry {
  SearchHistoryEntry({
    required this.id,
    required this.userId,
    required this.query,
    required this.createdAt,
  });

  factory SearchHistoryEntry.fromJson(Map<String, dynamic> json) {
    return SearchHistoryEntry(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      query: json['query'] as String? ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ??
              DateTime.now(),
    );
  }

  final String id;
  final String userId;
  final String query;
  final DateTime createdAt;
}

class AiChatMessage {
  AiChatMessage({
    required this.id,
    required this.userId,
    required this.prompt,
    required this.response,
    required this.createdAt,
  });

  factory AiChatMessage.fromJson(Map<String, dynamic> json) {
    return AiChatMessage(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      prompt: json['prompt'] as String? ?? '',
      response: json['response'] as String? ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ??
              DateTime.now(),
    );
  }

  final String id;
  final String userId;
  final String prompt;
  final String response;
  final DateTime createdAt;
}

class Coupon {
  Coupon({
    required this.id,
    required this.code,
    required this.description,
    required this.discountType,
    required this.discountValue,
    required this.active,
    required this.expiresAt,
  });

  factory Coupon.fromJson(Map<String, dynamic> json) {
    return Coupon(
      id: json['id'] as String? ?? '',
      code: json['code'] as String? ?? '',
      description: json['description'] as String? ?? '',
      discountType: json['discountType'] as String? ?? 'flat',
      discountValue: (json['discountValue'] as num?)?.toInt() ?? 0,
      active: json['active'] as bool? ?? false,
      expiresAt: json['expiresAt'] == null
          ? null
          : DateTime.tryParse(json['expiresAt'] as String)?.toLocal(),
    );
  }

  final String id;
  final String code;
  final String description;
  final String discountType;
  final int discountValue;
  final bool active;
  final DateTime? expiresAt;
}

class ScreenSeat {
  ScreenSeat({
    required this.id,
    required this.screenId,
    required this.rowLabel,
    required this.seatNumber,
    required this.seatType,
  });

  factory ScreenSeat.fromJson(Map<String, dynamic> json) {
    return ScreenSeat(
      id: json['id'] as String? ?? '',
      screenId: json['screenId'] as String? ?? '',
      rowLabel: json['rowLabel'] as String? ?? '',
      seatNumber: (json['seatNumber'] as num?)?.toInt() ?? 0,
      seatType: json['seatType'] as String? ?? 'Regular',
    );
  }

  final String id;
  final String screenId;
  final String rowLabel;
  final int seatNumber;
  final String seatType;

  String get label => '$rowLabel$seatNumber';
}

class MovieBookingStat {
  MovieBookingStat({
    required this.movieId,
    required this.title,
    required this.totalBookings,
    required this.totalSeatsBooked,
  });

  factory MovieBookingStat.fromJson(Map<String, dynamic> json) {
    return MovieBookingStat(
      movieId: json['movieId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      totalBookings: (json['totalBookings'] as num?)?.toInt() ?? 0,
      totalSeatsBooked: (json['totalSeatsBooked'] as num?)?.toInt() ?? 0,
    );
  }

  final String movieId;
  final String title;
  final int totalBookings;
  final int totalSeatsBooked;
}

class TheatreBookingStat {
  TheatreBookingStat({
    required this.theatreId,
    required this.name,
    required this.totalBookings,
    required this.totalSeatsBooked,
  });

  factory TheatreBookingStat.fromJson(Map<String, dynamic> json) {
    return TheatreBookingStat(
      theatreId: json['theatreId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      totalBookings: (json['totalBookings'] as num?)?.toInt() ?? 0,
      totalSeatsBooked: (json['totalSeatsBooked'] as num?)?.toInt() ?? 0,
    );
  }

  final String theatreId;
  final String name;
  final int totalBookings;
  final int totalSeatsBooked;
}

class GenrePopularityStat {
  GenrePopularityStat({
    required this.genreId,
    required this.name,
    required this.totalBookings,
    required this.totalSeatsBooked,
  });

  factory GenrePopularityStat.fromJson(Map<String, dynamic> json) {
    return GenrePopularityStat(
      genreId: json['genreId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      totalBookings: (json['totalBookings'] as num?)?.toInt() ?? 0,
      totalSeatsBooked: (json['totalSeatsBooked'] as num?)?.toInt() ?? 0,
    );
  }

  final String genreId;
  final String name;
  final int totalBookings;
  final int totalSeatsBooked;
}

class DailyRevenueStat {
  DailyRevenueStat({
    required this.revenueDate,
    required this.totalBookings,
    required this.totalRevenue,
  });

  factory DailyRevenueStat.fromJson(Map<String, dynamic> json) {
    return DailyRevenueStat(
      revenueDate: json['revenueDate'] as String? ?? '',
      totalBookings: (json['totalBookings'] as num?)?.toInt() ?? 0,
      totalRevenue: (json['totalRevenue'] as num?)?.toInt() ?? 0,
    );
  }

  final String revenueDate;
  final int totalBookings;
  final int totalRevenue;
}

class ShowOccupancyStat {
  ShowOccupancyStat({
    required this.showId,
    required this.movieId,
    required this.screenId,
    required this.totalSeats,
    required this.seatsBooked,
    required this.occupancyPercentage,
  });

  factory ShowOccupancyStat.fromJson(Map<String, dynamic> json) {
    return ShowOccupancyStat(
      showId: json['showId'] as String? ?? '',
      movieId: json['movieId'] as String? ?? '',
      screenId: json['screenId'] as String? ?? '',
      totalSeats: (json['totalSeats'] as num?)?.toInt() ?? 0,
      seatsBooked: (json['seatsBooked'] as num?)?.toInt() ?? 0,
      occupancyPercentage: (json['occupancyPercentage'] as num?)?.toDouble() ?? 0,
    );
  }

  final String showId;
  final String movieId;
  final String screenId;
  final int totalSeats;
  final int seatsBooked;
  final double occupancyPercentage;
}
