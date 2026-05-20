import '../../domain/entities/report.dart';

class ReportModel extends Report {
  const ReportModel({
    required super.id,
    required super.title,
    required super.clientId,
    required super.isPublished,
    super.shareToken,
    required super.createdAt,
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) {
    return ReportModel(
      id: json['id'] as String,
      title: json['title'] as String,
      clientId: json['clientId'] as String,
      isPublished: json['status'] == 'PUBLISHED',
      shareToken: json['shareToken'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
