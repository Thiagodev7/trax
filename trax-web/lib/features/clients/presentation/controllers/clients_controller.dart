import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_provider.dart';
import '../../data/datasources/clients_remote_datasource.dart';
import '../../domain/entities/client.dart';

class ClientsController extends AsyncNotifier<List<Client>> {
  late ClientsRemoteDataSource _dataSource;

  @override
  Future<List<Client>> build() async {
    _dataSource = ClientsRemoteDataSource(ref.watch(dioProvider));
    return _fetchClients();
  }

  Future<List<Client>> _fetchClients() async {
    return await _dataSource.getClients();
  }

  Future<void> createClient(String name) async {
    // Mantém o estado atual, passa pra loading e executa
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final newClient = await _dataSource.createClient(name);
      // Pega lista anterior
      final currentList = state.valueOrNull ?? [];
      return [newClient, ...currentList];
    });
  }
}

final clientsControllerProvider =
    AsyncNotifierProvider<ClientsController, List<Client>>(
  ClientsController.new,
);
