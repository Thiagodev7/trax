import 'package:dio/dio.dart';
import '../models/report_model.dart';

class ReportsRemoteDataSource {
  const ReportsRemoteDataSource(this._dio);

  final Dio _dio;

  Future<List<ReportModel>> getReports() async {
    final response = await _dio.get('/reports');
    final data = response.data['data'] as List;
    return data.map((json) => ReportModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<ReportModel> createReport(String title, String clientId) async {
    final response = await _dio.post('/reports', data: {
      'title': title,
      'clientId': clientId,
    });
    return ReportModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ReportModel> publishReport(String id) async {
    final response = await _dio.patch('/reports/$id/publish');
    return ReportModel.fromJson(response.data as Map<String, dynamic>);
  }
}
