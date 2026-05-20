import 'package:dio/dio.dart';
import '../models/branding_model.dart';

class WhiteLabelRemoteDataSource {
  const WhiteLabelRemoteDataSource(this._dio);

  final Dio _dio;

  Future<BrandingModel> resolveTenant() async {
    final response = await _dio.get('/tenant/resolve');
    return BrandingModel.fromJson(response.data as Map<String, dynamic>);
  }
}
