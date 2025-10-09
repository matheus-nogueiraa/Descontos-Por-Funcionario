function aprovGerenteAlmoxarifado() {
    try {

        log.info("aprovGerenteAlmoxarifado *************************************")

        var aprovGerenteAlm = false;
        var indexProdutos = hAPI.getChildrenIndexes("tabela_itens_compras");

        if (indexProdutos.length < 1) {
            var array_itens = JSON.parse((hAPI.getCardValue('array_itens') + "").trim());

            for (var i = 0; i < array_itens.length; i++) {
                var item = array_itens[i];
                var tipoProduto = item.tipo;

                if (tipoProduto == "M1" || tipoProduto == "M2" || tipoProduto == "M3") {
                    aprovGerenteAlm = true;
                }
            }
        }
        else {
            for (var i = 0; i < indexProdutos.length; i++) {
                var tipoProduto = hAPI.getCardValue('tipoProduto___' + indexProdutos[i]).trim();

                if (tipoProduto == "M1" || tipoProduto == "M2" || tipoProduto == "M3") {
                    aprovGerenteAlm = true;
                }
            }
        }
    } catch (error) {
        log.info('Erro ao consultar se a solicitação de compras tem EPI/EPC!')
        log.dir(error)
    }

    return aprovGerenteAlm;
}