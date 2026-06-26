<div id="MyWidget_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide wgd-descontos-wrapper" data-params="MyWidget.instance()">
    <!-- Resources and Stylesheets -->
    <link rel="stylesheet" type="text/css" href="/style-guide/css/fluig-style-guide.min.css">
    <link type="text/css" rel="stylesheet" href="//cdn.datatables.net/1.11.3/css/jquery.dataTables.min.css" />
    <script src="/portal/resources/js/jquery/jquery.js"></script>
    <script src="/portal/resources/js/jquery/jquery-ui.min.js"></script>
    <script src="/style-guide/js/fluig-style-guide.min.js"></script>
    <script src="/style-guide/js/fluig-style-guide-chart.min.js"></script>
    <script src="/webdesk/vcXMLRPC.js"></script>
    <script src="/webdesk/vcXMLRPC-mobile.js"></script>
    
    <div class="wgd-descontos-container">
        
        <!-- Header Principal -->
        <header class="wgd-descontos-header">
            <div class="wgd-header-left">
                <div class="wgd-logo-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                </div>
                <div class="wgd-header-titles">
                    <h1>Consulta de Lançamentos de Descontos</h1>
                    <p>Gestão Administrativa, Auditoria e Controle de Verbas de Desconto</p>
                </div>
            </div>
        </header>

        <!-- Dashboard Section Grid -->
        <section class="wgd-dashboard-section row">
            
            <!-- Coluna da Esquerda: Cards e Breakdowns -->
            <div class="col-xs-12 col-md-7 wgd-dashboard-left">
                
                <!-- Cards de Status Compactos -->
                <div class="wgd-compact-stats-row">
                    <div class="wgd-compact-stat card-total">
                        <span class="compact-stat-label">Total de Casos</span>
                        <div class="compact-stat-value-row">
                            <h3 id="stat-total-${instanceId}">0</h3>
                            <span class="compact-stat-icon">📊</span>
                        </div>
                    </div>
                    
                    <div class="wgd-compact-stat card-andamento">
                        <span class="compact-stat-label">Em Andamento</span>
                        <div class="compact-stat-value-row">
                            <h3 id="stat-andamento-${instanceId}">0</h3>
                            <span class="compact-stat-icon" style="color: var(--status-andamento);">⚡</span>
                        </div>
                    </div>

                    <div class="wgd-compact-stat card-concluido">
                        <span class="compact-stat-label">Concluídos</span>
                        <div class="compact-stat-value-row">
                            <h3 id="stat-concluido-${instanceId}">0</h3>
                            <span class="compact-stat-icon" style="color: var(--status-concluido);">✔</span>
                        </div>
                    </div>

                    <div class="wgd-compact-stat card-cancelado">
                        <span class="compact-stat-label">Cancelados</span>
                        <div class="compact-stat-value-row">
                            <h3 id="stat-cancelado-${instanceId}">0</h3>
                            <span class="compact-stat-icon" style="color: var(--status-cancelado);">✖</span>
                        </div>
                    </div>
                </div>

                <!-- Distribuição por Categorias -->
                <div class="wgd-breakdowns-grid">
                    
                    <!-- Por Filial -->
                    <div class="wgd-breakdown-card">
                        <h4><i class="fluigicon fluigicon-company icon-sm" aria-hidden="true"></i> Por Filial</h4>
                        <div class="breakdown-list" id="breakdown-filial-${instanceId}">
                            <!-- Injetado via JS -->
                        </div>
                    </div>
                    
                    <!-- Por Tipo de Desconto -->
                    <div class="wgd-breakdown-card">
                        <h4><i class="fluigicon fluigicon-wallet icon-sm" aria-hidden="true"></i> Por Tipo</h4>
                        <div class="breakdown-list" id="breakdown-tipo-${instanceId}">
                            <!-- Injetado via JS -->
                        </div>
                    </div>

                    <!-- Por Verba -->
                    <div class="wgd-breakdown-card">
                        <h4><i class="fluigicon fluigicon-tag icon-sm" aria-hidden="true"></i> Por Verba</h4>
                        <div class="breakdown-list" id="breakdown-verba-${instanceId}">
                            <!-- Injetado via JS -->
                        </div>
                    </div>

                </div>

            </div>

            <!-- Coluna da Direita: Gráfico de Evolução -->
            <div class="col-xs-12 col-md-5 wgd-dashboard-right">
                <div class="wgd-chart-card">
                    <h4><i class="fluigicon fluigicon-trending-up icon-sm" aria-hidden="true"></i> Evolução de Casos (Últimos Dias)</h4>
                    <div class="chart-container" id="chart-container-${instanceId}">
                        <!-- Injetado via JS -->
                    </div>
                </div>
            </div>

        </section>

        <!-- Filtros de Pesquisa -->
        <section class="wgd-filters-card">
            <div class="filters-card-header">
                <h3><i class="fluigicon fluigicon-search icon-sm" aria-hidden="true"></i> Filtros de Pesquisa</h3>
            </div>
            <div class="filters-card-body">
                <form id="form-filters-${instanceId}" class="row" onsubmit="return false;">
                    
                    <!-- Linha 1 -->
                    <div class="col-xs-12 col-sm-6 col-md-3 form-group">
                        <label class="control-label" for="filter-numFluig-${instanceId}">Nº Processo</label>
                        <div class="input-group">
                            <span class="input-group-addon"><i class="fluigicon fluigicon-hashtag icon-sm" aria-hidden="true"></i></span>
                            <input type="number" id="filter-numFluig-${instanceId}" name="numFluig" class="form-control premium-input" placeholder="Ex: 10245">
                        </div>
                    </div>

                    <div class="col-xs-12 col-sm-6 col-md-3 form-group">
                        <label class="control-label" for="filter-filial-${instanceId}">Filial</label>
                        <div class="input-group">
                            <span class="input-group-addon"><i class="fluigicon fluigicon-company icon-sm" aria-hidden="true"></i></span>
                            <select id="filter-filial-${instanceId}" name="codFilial" class="form-control premium-input">
                                <option value="">Todas</option>
                            </select>
                        </div>
                    </div>

                    <div class="col-xs-12 col-sm-6 col-md-3 form-group">
                        <label class="control-label" for="filter-matricula-${instanceId}">Matrícula</label>
                        <div class="input-group">
                            <span class="input-group-addon"><i class="fluigicon fluigicon-user icon-sm" aria-hidden="true"></i></span>
                            <input type="text" id="filter-matricula-${instanceId}" name="matriculaColaborador" class="form-control premium-input" placeholder="Ex: 004523">
                        </div>
                    </div>

                    <div class="col-xs-12 col-sm-6 col-md-3 form-group">
                        <label class="control-label" for="filter-colaborador-${instanceId}">Colaborador</label>
                        <div class="input-group">
                            <span class="input-group-addon"><i class="fluigicon fluigicon-user icon-sm" aria-hidden="true"></i></span>
                            <input type="text" id="filter-colaborador-${instanceId}" name="nomeColaborador" class="form-control premium-input" placeholder="Nome do colaborador">
                        </div>
                    </div>

                    <!-- Linha 2 -->
                    <div class="col-xs-12 col-sm-6 col-md-3 form-group">
                        <label class="control-label" for="filter-status-${instanceId}">Status</label>
                        <select id="filter-status-${instanceId}" name="status" class="form-control premium-input">
                            <option value="" selected>Todos</option>
                            <option value="0">Em Andamento</option>
                            <option value="2">Concluído</option>
                            <option value="1">Cancelado</option>
                        </select>
                    </div>

                    <div class="col-xs-12 col-sm-6 col-md-3 form-group">
                        <label class="control-label" for="filter-atividade-${instanceId}">Atividade Atual</label>
                        <select id="filter-atividade-${instanceId}" name="atividade" class="form-control premium-input">
                            <option value="">Todos</option>
                        </select>
                    </div>

                    <div class="col-xs-12 col-sm-6 col-md-3 form-group">
                        <label class="control-label" for="filter-dataDe-${instanceId}">Data De</label>
                        <input type="date" id="filter-dataDe-${instanceId}" name="dataDe" class="form-control premium-input">
                    </div>

                    <div class="col-xs-12 col-sm-6 col-md-3 form-group">
                        <label class="control-label" for="filter-dataAte-${instanceId}">Data Até</label>
                        <input type="date" id="filter-dataAte-${instanceId}" name="dataAte" class="form-control premium-input">
                    </div>

                </form>
                
                <div class="wgd-actions-row">
                    <button type="button" class="btn btn-premium-outline" data-click="limparFiltros">
                        <i class="fluigicon fluigicon-refresh icon-sm" aria-hidden="true"></i> Limpar
                    </button>
                    <button type="button" class="btn btn-premium-primary" data-click="executarBusca">
                        <i class="fluigicon fluigicon-search icon-sm" aria-hidden="true"></i> Filtrar
                    </button>
                </div>
            </div>
        </section>

        <!-- Resultados -->
        <section class="wgd-results-card">
            
            <!-- Skeleton Loader -->
            <div id="wgd-loader-${instanceId}" class="wgd-feedback-container hidden">
                <div class="spinner-glow-ring"></div>
                <h4>Buscando registros...</h4>
                <p>Por favor, aguarde enquanto consultamos o banco de dados do Fluig.</p>
            </div>

            <!-- Empty State -->
            <div id="wgd-empty-${instanceId}" class="wgd-feedback-container hidden">
                <div class="empty-state-shield">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                </div>
                <h3>Nenhum Registro Encontrado</h3>
                <p>Nenhum lançamento de desconto corresponde aos filtros de busca aplicados.</p>
            </div>

            <!-- Tabela de Dados -->
            <div id="wgd-table-wrapper-${instanceId}" class="wgd-table-responsive">
                <div style="text-align:right; padding: 10px 0 8px;">
                    <button type="button" id="btn-exportar-excel-${instanceId}" style="padding:7px 16px; background:#217346; color:#fff; border:none; border-radius:6px; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(33,115,70,0.22);">
                        <i class="fluigicon fluigicon-download icon-sm" aria-hidden="true"></i>&nbsp;Exportar Excel
                    </button>
                </div>
                <table class="table custom-premium-table">
                    <thead>
                        <tr>
                            <th class="col-processo">Processo</th>
                            <th class="col-data">Data</th>
                            <th class="col-colaborador">Colaborador / Filial</th>
                            <th class="col-cc">C. Custo</th>
                            <th class="col-verba">Verba</th>
                            <th class="col-tipo">Tipo</th>
                            <th class="col-valor">Valor</th>
                            <th class="col-periodo">1ª Parcela</th>
                            <th class="col-parcelas">Parcelas</th>
                            <th class="col-status">Status</th>
                            <th>Atividade</th>
                            <th class="text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-results-${instanceId}">
                        <!-- Injetado via JS -->
                    </tbody>
                </table>
                
                <!-- Paginação Premium -->
                <div id="wgd-pagination-container-${instanceId}" class="wgd-table-pagination hidden">
                    <div class="pagination-info">
                        Exibindo de <span id="pagination-start-${instanceId}">0</span> a <span id="pagination-end-${instanceId}">0</span> de <span id="pagination-total-${instanceId}">0</span> registros
                    </div>
                    <div class="pagination-controls">
                        <button type="button" class="btn btn-pagination-nav" id="btn-page-prev-${instanceId}" data-click="paginaAnterior">
                            <i class="fluigicon fluigicon-chevron-left icon-sm" aria-hidden="true"></i> Anterior
                        </button>
                        <div id="pagination-pages-${instanceId}" class="pagination-pages-list">
                            <!-- Injetado via JS -->
                        </div>
                        <button type="button" class="btn btn-pagination-nav" id="btn-page-next-${instanceId}" data-click="paginaProxima">
                            Próximo <i class="fluigicon fluigicon-chevron-right icon-sm" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>

        </section>

    </div>
</div>
