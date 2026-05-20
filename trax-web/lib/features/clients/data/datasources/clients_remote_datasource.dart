import 'package:dio/dio.dart';
import '../models/client_model.dart';

class ClientsRemoteDataSource {
  const ClientsRemoteDataSource(this._dio);

  final Dio _dio;

  Future<List<ClientModel>> getClients() async {
    final response = await _dio.get('/clients');
    final data = response.data['data'] as List;
    return data.map((json) => ClientModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<ClientModel> createClient(String name) async {
    final response = await _dio.post('/clients', data: {'name': name});
    return ClientModel.fromJson(response.data as Map<String, dynamic>);
  }
}
