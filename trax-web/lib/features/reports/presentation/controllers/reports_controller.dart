import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_provider.dart';
import '../../data/datasources/reports_remote_datasource.dart';
import '../../domain/entities/report.dart';

class ReportsController extends AsyncNotifier<List<Report>> {
  late ReportsRemoteDataSource _dataSource;

  @override
  Future<List<Report>> build() async {
    _dataSource = ReportsRemoteDataSource(ref.watch(dioProvider));
    return _fetchReports();
  }

  Future<List<Report>> _fetchReports() async {
    return await _dataSource.getReports();
  }

  Future<Report> createReport(String title, String clientId) async {
    final newReport = await _dataSource.createReport(title, clientId);
    // Adiciona o novo relatório no topo da lista localmente para refletir na UI rápido
    final currentList = state.valueOrNull ?? [];
    state = AsyncData([newReport, ...currentList]);
    return newReport;
  }

  Future<void> publishReport(String reportId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final updatedReport = await _dataSource.publishReport(reportId);
      final currentList = state.valueOrNull ?? [];
      return currentList.map((r) => r.id == reportId ? updatedReport : r).toList();
    });
  }
}

final reportsControllerProvider =
    AsyncNotifierProvider<ReportsController, List<Report>>(
  ReportsController.new,
);
