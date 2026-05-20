import 'package:equatable/equatable.dart';

class Report extends Equatable {
  final String id;
  final String title;
  final String clientId;
  final bool isPublished;
  final String? shareToken;
  final DateTime createdAt;

  const Report({
    required this.id,
    required this.title,
    required this.clientId,
    required this.isPublished,
    this.shareToken,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, title, clientId, isPublished, shareToken, createdAt];
}
