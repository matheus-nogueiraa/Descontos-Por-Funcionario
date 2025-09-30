<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="/style-guide/css/fluig-style-guide.min.css">
    <link rel="stylesheet" href="../webapp/resources/css/wdg_lancamento_descontos_funcionario.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css">
    <link rel="stylesheet" href="../webapp/resources/css/wgd_descontos_por_funcionario.css">
    <!-- <link rel="stylesheet" href="https://fluigtst.elcop.eng.br:8443//style-guide/css/fluig-style-guide.min.css"> -->
    <link type="text/css" rel="stylesheet" href="//cdn.datatables.net/1.11.3/css/jquery.dataTables.min.css">
    <script src="/portal/resources/js/jquery/jquery.js"></script>
    <script src="/portal/resources/js/jquery/jquery-ui.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.16/jquery.mask.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.5/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-k6d4wzSIapyDyv1kpU366/PK5hCdSbCRGRCMv+eplOQJWyd1fbcAu9OCUj5zNLiq"
        crossorigin="anonymous"></script>
    <script src="//cdn.datatables.net/1.11.3/js/jquery.dataTables.min.js"></script>
    <script src="//cdn.datatables.net/buttons/2.1.0/js/dataTables.buttons.min.js"></script>
    <script src="//cdn.datatables.net/buttons/2.1.0/js/buttons.html5.min.js"></script>
    <script src="//cdn.datatables.net/buttons/2.1.0/js/buttons.print.min.js"></script>
    <script src="/portal/resources/js/mustache/mustache-min.js"></script>
    <script src="/style-guide/js/fluig-style-guide.min.js" charset="utf-8"></script>
    <script type="text/javascript" src="/webdesk/vcXMLRPC.js"></script>
    <script type="text/javascript" src="/webdesk/vcXMLRPC-mobile.js"></script>
    <script src="../webapp/resources/js/novosAtivos.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.5/dist/signature_pad.umd.min.js"></script>
    <script src="/portal/resources/js/wcm/wcm.widgetAPI.js"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js" charset="utf-8"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js" charset="utf-8"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>

<body>
    <div id="MyWidget_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide"
        data-params="MyWidget.instance()">

        <div class="loading-overlay" id="loadingOverlay" style="display: none;">
            <div class="loading-spinner"></div>
        </div>
        <!-- Inputs hidden -->
        <input type="hidden" id="salario">
        <input type="hidden" id="salario15">
        <input type="hidden" id="nomeUsuario">
        <input type="hidden" id="emailUsuario">
        <input type="hidden" id="matriculaUsuario">
        <input type="hidden" id="futuros_json" value="">

        <!-- Header -->
        <div class="card">
            <div class="card-body">
                <div class="row">
                    <div class="form-group col-md-6 css_header_img" style="margin-left: 1rem;">
                        <img src="/wdg_lancamento_descontos_funcionario/resources/images/elcop_nossa_energia.png"
                            alt="Logo Elcop" width="329px" height="194px">
                        <label class="css_header_text">Lançamentos de Descontos por Funcionário</label>
                    </div>
                </div>
            </div>
        </div>

        <div class="card mt-4">
            <div class="card-body">
                <h2>Consulta</h2>
                <br>
                <!-- Filtros -->
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h3 class="panel-title">Descontos por Funcionário</h3>
                    </div>
                    <div class="row panel-body">
                        <div class="col-md-10">
                            <label for="">Selecione o Funcionário</label>
                            <input type="text" name="funcionarioFiltro" id="funcionarioFiltro" class="form-control">
                            <small>* Digite o nome do funcionário que você deseja consultar...</small>
                        </div>
                        <div class="col-md-2">
                            <label for="">&nbsp;</label>
                            <button id="btn-buscar" class="btn btn-success form-control">
                                <i class="bi bi-search"></i>
                                Consultar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tabela -->
                <div class="panel panel-default" id="painelFuncionario" style="display: none;">
                    <div class="panel-heading">
                        <h3 class="panel-title">Ativos atuais</h3>
                    </div>
                    <div class="panel-body">
                        <div style="margin-bottom: 1rem;">
                            <button class="btn btn-default" onclick="abrirModalAtivos()">Cadastrar novos ativos</button>
                        </div>
                        <div id="dadosFuncionario" style="margin-bottom: 1rem;"></div>
                        <input type="hidden" name="codFilial" id="codFilial" value="">
                        <input type="hidden" name="matriculaFunc" id="matriculaFunc" value="">
                        <input type="hidden" name="nomeColaborador" id="nomeColaborador" value="">
                        <div class="row">
                            <div class="col-md-8">
                                <h4>Lançamentos Ativos</h4>
                                <table id="tabelaDescontos" class="table table-responsive table-bordered"></table>
                            </div>
                            <div class="col-md-4">
                                <h4>Resumo Geral</h4>
                                <table class="table table-bordered" id="tabelaResumoGeral">
                                    <tbody>
                                        <tr>
                                            <th>Valor Total</th>
                                            <td id="valorTotalResumo"></td>
                                        </tr>
                                        <tr>
                                            <th>Valor Período <span id="periodoAtual"></span></th>
                                            <td id="valorParcelaMensalResumo"></td>
                                        </tr>
                                        <tr>
                                            <th>15% do Salário</th>
                                            <td id="quinzePorCentroSalario"></td>
                                            <input type="hidden" name="valQuinzePorCentroSalario"
                                                id="valQuinzePorCentroSalario" value="0">
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <hr style="margin: 24px 0;">

                        <div class="row">
                            <div class="col-md-12">
                                <h4>Lançamentos Futuros</h4>

                                <!-- totalizador simples (opcional) -->
                                <div class="mb-2">
                                    <strong>Total de Futuros:</strong>
                                    <span id="totalFuturosValor">R$ 0,00</span>
                                </div>

                                <table id="tabelaFuturos" class="table table-responsive table-bordered">
                                    <thead>
                                        <tr>
                                            <th style="width:120px;">Período</th>
                                            <th style="width:100px;">Verba</th>
                                            <th style="width:160px;">Documento</th>
                                            <th style="width:140px;">Valor (R$)</th>
                                            <th style="width:110px;">Parcelas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- preenchido via JS -->
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colspan="3" class="text-right">Total</th>
                                            <th id="tabelaFuturos_total">R$ 0,00</th>
                                            <th></th>
                                        </tr>
                                    </tfoot>
                                </table>

                                <!-- mensagem "sem registros" (aparece quando a lista vier vazia) -->
                                <div id="futurosVazio" class="text-muted" style="display:none;">
                                    Nenhum lançamento futuro para exibir.
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de Ativos -->
        <div class="modal" id="modalAtivos">
            <div class="modal-content">
                <span class="fechar" onclick="fecharModalAtivos()">&times;</span>
                <div class="panel panel-primary">
                    <div class="panel-heading ModalTeste">
                        <h5 class="panel-title">Lançamentos de novos descontos</h5>
                    </div>
                    <div class="panel-body">
                        <div class="form-group d-flex flex-row justify-content-between mb-3" style="gap: 2rem;">
                            <div class="form-group mb-3">
                                <div class="row align-items-center" style="gap: 0;">
                                    <div class="col-md-3">
                                        <div class="destaqueText"><strong>Filial:</strong></div>
                                        <div id="codFilialModal"></div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="destaqueText"><strong>Funcionário:</strong></div>
                                        <div id="codFuncionarioModal"></div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="destaqueText"><strong>Salário:</strong></div>
                                        <div id="salarioModal"></div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="destaqueText"><strong>15% do Salário:</strong></div>
                                        <div id="15salarioModal"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">Tipo de Desconto</h3>
                            </div>
                            <div class="panel-body">
                                <div class="row">
                                    <div class="col-md-3">
                                        <div>
                                            <label> <input name="rdTipoDesconto" id="rdTipoDesconto_almoxarifado"
                                                    value="almoxarifado" type="radio"
                                                    onchange="mudaVerbasNovoDesconto(this.value)">
                                                <span class="">Almoxarifado <i
                                                        class="fluigicon fluigicon-question-sign icon-sm"
                                                        data-toggle="tooltip" data-html="true"
                                                        title="Em caso de uso indevido de material do almoxarifado da Elcop."></i></span>
                                            </label>
                                        </div>

                                        <div>
                                            <label> <input name="rdTipoDesconto" id="rdTipoDesconto_ti" value="ti"
                                                    type="radio" onchange="mudaVerbasNovoDesconto(this.value)">
                                                <span class="">Tecnologia da Informação <i
                                                        class="fluigicon fluigicon-question-sign icon-sm"
                                                        data-toggle="tooltip" data-html="true"
                                                        title="Em caso de descontos relacionados a T.I. da Elcop."></i></span>
                                            </label>
                                        </div>

                                        <div>
                                            <label> <input name="rdTipoDesconto" id="rdTipoDesconto_frotas"
                                                    value="frotas" type="radio"
                                                    onchange="mudaVerbasNovoDesconto(this.value)">
                                                <span class="">Frotas <i
                                                        class="fluigicon fluigicon-question-sign icon-sm"
                                                        data-toggle="tooltip" data-html="true"
                                                        title="Em caso de multas de trânsito, avaria em veículos e outros relacionados ao frotas da Elcop."></i></span>
                                            </label>
                                        </div>

                                        <div>
                                            <label> <input name="rdTipoDesconto" id="rdTipoDesconto_dp" value="dp"
                                                    type="radio" onchange="mudaVerbasNovoDesconto(this.value)">
                                                <span class="">Departamento Pessoal <i
                                                        class="fluigicon fluigicon-question-sign icon-sm"
                                                        data-toggle="tooltip" data-html="true"
                                                        title="Em caso de faltas, vales e demais descontos relacionados ao departamento pessoal da Elcop."></i></span>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-9">
                                        <select name="verbaNovoDesconto" id="verbaNovoDesconto" class="form-control">

                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">Novo Desconto</h3>
                            </div>
                            <div class="panel-body">
                                <div class="row">
                                    <div class="col-md-8">
                                        <label for="descricao">Descrição do desconto</label>
                                        <input type="text" class="form-control" id="descricao"
                                            placeholder="Digite a descrição do desconto">
                                    </div>
                                    <div class="col-md-4">
                                        <label for="valorEpi">Valor total do desconto (R$)</label>
                                        <input type="text" class="form-control" id="valorEpi" placeholder="00.000,00"
                                            mask="#00.000.000.000.000,00">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">Caputura de Foto</h3>
                            </div>
                            <div class="panel-body">
                                <div class="row" id="cameraContainer">
                                    <div class="form-group col-md-10">
                                        <input type="file" accept=".png, .jpg, .jpeg, .bmp, .pdf" capture="user"
                                            id="cameraInputPhotoEPI"
                                            class="form-control btn btndanger button_attachments"
                                            onchange="reloadPreview()">
                                        <img class="previewFotoEPI" style="width: 100%; margin-top: 10px;" src="" />
                                    </div>
                                    <div class="form-group col-md-1">
                                        <button id="btnLimparFoto" class="btn btn-danger" onclick="removePhoto()">Limpar
                                            Foto</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-12">
                                <button class="btn btn-success widthFull" id="btnVincularEpiXFuncionario"
                                    onclick="openModalAssinatura()">Solicitar Assinatura</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de Assinatura -->
        <div class="modal" id="modalAssinatura">
            <div class="modal-content">
                <span class="fechar" onclick="fecharModalAssinatura()">&times;</span>
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h3 class="panel-title">Revisão</h3>
                    </div>
                    <div class="panel-body">

                        <!-- Bloco de revisão dos dados -->
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">Revisão dos dados</h3>
                            </div>
                            <div class="panel-body">
                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <div id="revisaoFuncionario"></div>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <div id="revisaoEpis"></div>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <div id="revisaoTipoDesconto"></div>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <div id="revisaoParcelas"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Foto Capturada -->
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">Foto Capturada</h3>
                            </div>
                            <div class="panel-body">
                                <img class="previewFotoEPI" style="width: 100%; margin-top: 10px;" src="" />
                            </div>
                        </div>

                        <!-- Confirmação -->
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">Confirmação</h3>
                            </div>
                            <div class="panel-body">

                                <!-- Alternância -->
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label>O funcionário recusou assinar?</label>
                                        <div>
                                            <label class="mr-3"><input type="radio" name="recusaAssinatura" value="nao"
                                                    checked onchange="onToggleRecusa()"> Não</label>
                                            <label class="ml-3"><input type="radio" name="recusaAssinatura" value="sim"
                                                    onchange="onToggleRecusa()"> Sim</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6" id="blocoMotivoRecusa" style="display:none;">
                                        <label for="motivoRecusa">Motivo da recusa</label>
                                        <textarea id="motivoRecusa" class="form-control" rows="2"
                                            placeholder="Descreva brevemente o motivo..."></textarea>
                                    </div>
                                </div>

                                <!-- Assinatura do funcionário -->
                                <div id="blocoAssinaturaFuncionario">
                                    <div class="row">
                                        <div class="form-group col-md-12 text-left">
                                            <p class="text-danger">Ao assinar abaixo, o funcionário confirma os
                                                lançamentos de novos descontos.</p>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="form-group col-md-12 text-center">
                                            <canvas id="signature-pad-func"
                                                style="border:1px solid #ccc; width:100%; height:150px;"></canvas>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="form-group col-md-12">
                                            <button class="btn btn-danger"
                                                onclick="clearPad('signature-pad-func')">Limpar Assinatura</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Testemunhas (só aparece em recusa) -->
                                <div id="blocoTestemunhas" style="display:none;">

                                    <p class="text-muted">Em caso de recusa do funcionário, colete assinaturas de
                                        <strong>duas testemunhas</strong> e evidências.
                                    </p>

                                    <!-- Testemunha 1 -->
                                    <div class="panel panel-default">
                                        <div class="panel-heading">
                                            <h4 class="panel-title">Testemunha 1</h4>
                                        </div>
                                        <div class="panel-body">
                                            <div class="row">
                                                <div class="col-md-4"><label>Nome</label><input type="text"
                                                        id="test1_nome" class="form-control"></div>
                                                <div class="col-md-4"><label>CPF</label><input type="text"
                                                        id="test1_cpf" class="form-control"
                                                        placeholder="000.000.000-00"></div>
                                                <div class="col-md-4"><label>Cargo/Setor</label><input type="text"
                                                        id="test1_cargo" class="form-control"></div>
                                            </div>
                                            <div class="row mt-2">
                                                <div class="col-md-8">
                                                    <label>Assinatura</label>
                                                    <canvas id="signature-pad-test1"
                                                        style="border:1px solid #ccc; width:100%; height:120px;"></canvas>
                                                    <button class="btn btn-danger"
                                                        onclick="clearPad('signature-pad-test1')">Limpar</button>
                                                </div>
                                                <div class="col-md-4">
                                                    <label>Foto/Evidência (opcional)</label>
                                                    <input type="file" id="test1_foto" class="form-control"
                                                        accept=".png,.jpg,.jpeg,.bmp,.pdf">
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Testemunha 2 -->
                                    <div class="panel panel-default">
                                        <div class="panel-heading">
                                            <h4 class="panel-title">Testemunha 2</h4>
                                        </div>
                                        <div class="panel-body">
                                            <div class="row">
                                                <div class="col-md-4"><label>Nome</label><input type="text"
                                                        id="test2_nome" class="form-control"></div>
                                                <div class="col-md-4"><label>CPF</label><input type="text"
                                                        id="test2_cpf" class="form-control"
                                                        placeholder="000.000.000-00"></div>
                                                <div class="col-md-4"><label>Cargo/Setor</label><input type="text"
                                                        id="test2_cargo" class="form-control"></div>
                                            </div>
                                            <div class="row mt-2">
                                                <div class="col-md-8">
                                                    <label>Assinatura</label>
                                                    <canvas id="signature-pad-test2"
                                                        style="border:1px solid #ccc; width:100%; height:120px;"></canvas>
                                                    <button class="btn btn-danger"
                                                        onclick="clearPad('signature-pad-test2')">Limpar</button>
                                                </div>
                                                <div class="col-md-4">
                                                    <label>Foto/Evidência (opcional)</label>
                                                    <input type="file" id="test2_foto" class="form-control"
                                                        accept=".png,.jpg,.jpeg,.bmp,.pdf">
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Evidências gerais -->
                                    <div class="panel panel-default">
                                        <div class="panel-heading">
                                            <h4 class="panel-title">Evidências Complementares</h4>
                                        </div>
                                        <div class="panel-body">
                                            <input type="file" id="evidenciasExtras" class="form-control" multiple
                                                accept=".png,.jpg,.jpeg,.bmp,.pdf">
                                            <small class="text-muted">Fotos do ativo, conversas, documentos etc.</small>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        <!-- Botão final -->
                        <div class="row">
                            <div class="form-group col-md-12">
                                <button class="btn btn-success widthFull" onclick="iniciarProcesso()">Confirmar</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
</body>

</html>