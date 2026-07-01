function createDataset(fields, constraints, sortFields) {
    var newDataset = DatasetBuilder.newDataset();
    var jdbcName = fluigAPI.getTenantService().getTenantData(["jdbcNameFluig"]).get("jdbcNameFluig").trim();
    var dataSource = "java:/jdbc/" + jdbcName;
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;
    var myQuery = "";
    var numFluig = "";
    var codFilial = "";
    var matriculaColaborador = "";
    var nomeColaborador = "";
    var status = "";
    var atividade = "";
    var dataDe = "";
    var dataAte = "";

    if (constraints && constraints.length > 0) {
        for (var c = 0; c < constraints.length; c++) {
            var fieldName = String(constraints[c].fieldName);
            var initialValue = String(constraints[c].initialValue).trim();
            
            if (fieldName == "numFluig") {
                numFluig = initialValue;
            } else if (fieldName == "codFilial") {
                codFilial = initialValue;
            } else if (fieldName == "matriculaColaborador") {
                matriculaColaborador = initialValue;
            } else if (fieldName == "nomeColaborador") {
                nomeColaborador = initialValue;
            } else if (fieldName == "status") {
                status = initialValue;
            } else if (fieldName == "atividade") {
                atividade = initialValue;
            } else if (fieldName == "dataDe") {
                dataDe = initialValue;
            } else if (fieldName == "dataAte") {
                dataAte = initialValue;
            }
        }
    }

    myQuery += " SELECT ";
    myQuery += "     pw.NUM_PROCES numFluig, ";
    myQuery += "     pw.NUM_VERS AS versao, ";
    myQuery += "     formDescontos.dataSolicitacao, ";
    myQuery += "     formDescontos.horaSolicitacao, ";
    myQuery += "     formDescontos.nomeColaborador, ";
    myQuery += "     formDescontos.codFilial, ";
    myQuery += "     formDescontos.matriculaColaborador, ";
    myQuery += "     formDescontos.grupoAprovadorCC, ";
    myQuery += "     formDescontos.codVerba, ";
    myQuery += "     formDescontos.tipoDesconto, ";
    myQuery += "     formDescontos.valorEpi, ";
    myQuery += "     pw.STATUS status, ";
    myQuery += "     SRK.RK_PERINI AS periodoPrimeiraParcela, ";
    myQuery += "     SRK.totalParcelas, ";
    myQuery += "     CASE ";
    myQuery += "     	WHEN formDescontos.atividadeAtual = '56' THEN 'Rejeitado pelo Gestor' ";
    myQuery += "     	WHEN formDescontos.atividadeAtual = '53' THEN 'Desconto Abonado' ";
    myQuery += "     	WHEN formDescontos.atividadeAtual = '10' THEN 'Desconto Confirmado' ";
    myQuery += "     	ELSE STRING_AGG(ep.NOM_ESTADO, ';') ";
    myQuery += "     END AS nomeAtividade  ";
    myQuery += " FROM PROCES_WORKFLOW pw ";
    myQuery += " INNER JOIN ML001215 formDescontos ";
    myQuery += "     ON formDescontos.companyid = pw.COD_EMPRESA ";
    myQuery += " AND formDescontos.cardid = pw.NR_DOCUMENTO_CARD_INDEX ";
    myQuery += " AND formDescontos.documentid = pw.NR_DOCUMENTO_CARD ";
    myQuery += " OUTER APPLY ( ";
    myQuery += "     SELECT ";
    myQuery += "         hp.NUM_SEQ_ESTADO, ";
    myQuery += "         hp.NUM_SEQ_MOVTO, ";
    myQuery += "         hp.COD_EMPRESA, ";
    myQuery += "         hp.NUM_PROCES ";
    myQuery += "     FROM HISTOR_PROCES hp ";
    myQuery += "     WHERE hp.COD_EMPRESA = pw.COD_EMPRESA ";
    myQuery += "     AND hp.NUM_PROCES = pw.NUM_PROCES ";
    myQuery += "     AND hp.LOG_ATIV = 1 ";
    myQuery += " ) hp ";
    myQuery += " LEFT JOIN ESTADO_PROCES ep ";
    myQuery += " ON ep.COD_DEF_PROCES = 'wf_lancamento_descontos_funcionario' ";
    myQuery += " AND ep.NUM_VERS = pw.NUM_VERS ";
    myQuery += " AND ep.NUM_SEQ = COALESCE(hp.NUM_SEQ_ESTADO, formDescontos.atividadeAtual) ";
    myQuery += " AND ep.COD_EMPRESA = pw.COD_EMPRESA ";
    myQuery += " OUTER APPLY ( ";
    myQuery += "     SELECT ";
    myQuery += "         MIN(SRK.RK_PERINI) AS RK_PERINI, ";
    myQuery += "         COUNT(*) AS totalParcelas ";
    myQuery += "     FROM sigaofc.dbo.SRK010 SRK ";
    myQuery += "     WHERE SRK.D_E_L_E_T_ = ' ' ";
    myQuery += "     AND SRK.RK_MAT COLLATE Latin1_General_CI_AS = ";
    myQuery += "         LTRIM(RTRIM( ";
    myQuery += "             SUBSTRING( ";
    myQuery += "                 formDescontos.nomeColaborador, ";
    myQuery += "                 CHARINDEX(' - ', formDescontos.nomeColaborador) + 3, ";
    myQuery += "                 CHARINDEX(' - ', formDescontos.nomeColaborador, ";
    myQuery += "                     CHARINDEX(' - ', formDescontos.nomeColaborador) + 3 ";
    myQuery += "                 ) - CHARINDEX(' - ', formDescontos.nomeColaborador) - 3 ";
    myQuery += "             ) ";
    myQuery += "         )) COLLATE Latin1_General_CI_AS ";
    myQuery += "     AND SRK.RK_PD COLLATE Latin1_General_CI_AS = ";
    myQuery += "         formDescontos.codVerba COLLATE Latin1_General_CI_AS ";
    myQuery += "     AND SRK.RK_XFLUIG = pw.NUM_PROCES ";
    myQuery += " ) SRK ";
    myQuery += " WHERE pw.COD_DEF_PROCES = 'wf_lancamento_descontos_funcionario' ";
    myQuery += " AND formDescontos.version = ( ";
    myQuery += "         SELECT MAX(formDescontos2.version) ";
    myQuery += "         FROM ML001215 formDescontos2 ";
    myQuery += "         WHERE formDescontos2.documentid = formDescontos.documentid ";
    myQuery += " ) ";

    if (numFluig != "") {
        myQuery += " AND pw.NUM_PROCES = '" + numFluig + "' ";
    }
    if (codFilial != "") {
        myQuery += " AND formDescontos.codFilial LIKE '%" + codFilial + "%' ";
    }
    if (matriculaColaborador != "") {
        myQuery += " AND formDescontos.matriculaColaborador LIKE '%" + matriculaColaborador + "%' ";
    }
    if (nomeColaborador != "") {
        myQuery += " AND formDescontos.nomeColaborador LIKE '%" + nomeColaborador + "%' ";
    }
    if (status != "") {
        myQuery += " AND pw.STATUS = " + status + " ";
    }
    if (atividade != "") {
        myQuery += " AND hp.NUM_SEQ_ESTADO = " + atividade + " ";
    }
    if (dataDe != "") {
        myQuery += " AND COALESCE(TRY_CONVERT(DATE, formDescontos.dataSolicitacao, 103), TRY_CONVERT(DATE, formDescontos.dataSolicitacao, 120), TRY_CAST(formDescontos.dataSolicitacao AS DATE)) >= '" + dataDe + "' ";
    }
    if (dataAte != "") {
        myQuery += " AND COALESCE(TRY_CONVERT(DATE, formDescontos.dataSolicitacao, 103), TRY_CONVERT(DATE, formDescontos.dataSolicitacao, 120), TRY_CAST(formDescontos.dataSolicitacao AS DATE)) <= '" + dataAte + "' ";
    }

    myQuery += " GROUP BY ";
    myQuery += "     pw.NUM_PROCES, ";
    myQuery += "     pw.NUM_VERS, ";
    myQuery += "     formDescontos.dataSolicitacao, ";
    myQuery += "     formDescontos.horaSolicitacao, ";
    myQuery += "     formDescontos.nomeColaborador, ";
    myQuery += "     formDescontos.codFilial, ";
    myQuery += "     formDescontos.matriculaColaborador, ";
    myQuery += "     formDescontos.grupoAprovadorCC, ";
    myQuery += "     formDescontos.codVerba, ";
    myQuery += "     formDescontos.tipoDesconto, ";
    myQuery += "     formDescontos.valorEpi, ";
    myQuery += "     SRK.RK_PERINI, ";
    myQuery += "     SRK.totalParcelas, ";
    myQuery += "     pw.STATUS, ";
    myQuery += "     formDescontos.atividadeAtual ";
    myQuery += " ORDER BY pw.NUM_PROCES DESC; ";

    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(myQuery);
        var columnCount = rs.getMetaData().getColumnCount();
        while (rs.next()) {
            if (!created) {
                for (var i = 1; i <= columnCount; i++) {
                    newDataset.addColumn(rs.getMetaData().getColumnName(i));
                }
                created = true;
            }
            var Arr = new Array();
            for (var i = 1; i <= columnCount; i++) {
                var value = rs.getString(i);
                if (value != null) {
                    value = String(value).replace(/\u0000/g, ""); // remove NUL
                } else {
                    value = "";
                }
                Arr[i - 1] = value;
            }
            newDataset.addRow(Arr);
        }
    } catch (e) {
        log.error("ERRO==============> " + e.message);
    } finally {
        if (rs != null) {
            rs.close();
        }
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }

    return newDataset;
}
