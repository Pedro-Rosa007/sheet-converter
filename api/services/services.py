import pandas as pd
import os
import openpyxl
from pathlib import Path




class Services:
    
    def __init__(self):

        base_path = Path(__file__).parent.parent.parent
        env_root = os.environ.get("PLANILHAS_ROOT")
        if env_root:
            base_path = Path(env_root)
        self.base_path = base_path
        self.planilhas_path = self.base_path / "planilhas"
        self.planilhas_path.mkdir(parents=True, exist_ok=True)
        
        self.id_cliente = None
        self.codigo_cliente = None
        self.nome_cliente = None
        self.descricao_cliente = None
        self.preco_cliente = None
        self.grupo_cliente = None
        self.subgrupo_cliente = None
        self.impressao_cliente = None
        self.ncm_cliente = None
        self.cest_cliente = None
        self.uncompra_cliente = None
        self.unvendas_cliente = None
        self.pesavel_cliente = None
        self.fracionado_cliente = None
        self.exportarbalanca_cliente = None
        self.classificacao_cliente = None
        self.planilha_cliente = None
        
        self.output_path = self.planilhas_path / "Planilha_Base.xlsx"
        self.client_path = self.planilhas_path
        
        self.default_collumns()
    
    def default_collumns(self):
        
        self.id = str("ID")
        self.codigo = str("Codigo")
        self.nome = str("Nome")
        self.descricao = str("Descrição")
        self.preco = str("Preço")
        self.grupo = str("Grupo")
        self.subgrupo = str("Subgrupo")
        self.impressao = str("Local Impressão")
        self.ncm = str("NCM")
        self.cest = str("CEST")
        self.uncompra= str("Un Compra")
        self.unvendas = str("Un Vendas")
        self.pesavel = str("PESAVEL")
        self.fracionado = str("FRACIONADO")
        self.exportarbalanca = str("EXPORTAR BALANÇA")
        self.classificacao = str("Nome Classificação Fiscal")
        
        
    def createnewxlsx(self):

        try:
            self.dados = [
                self.id,
                self.codigo,
                self.nome, 
                self.descricao, 
                self.preco, 
                self.grupo, 
                self.subgrupo, 
                self.impressao, 
                self.ncm, 
                self.cest, 
                self.uncompra,
                self.unvendas, 
                self.pesavel, 
                self.fracionado,
                self.exportarbalanca, 
                self.classificacao 
            ]

            self.df = pd.DataFrame(columns=self.dados)
            self.df.to_excel(self.output_path, index=False)
            
            return {"status": "success", "message": "Planilha base criada com sucesso", "path": str(self.output_path)}
        
        except Exception as e:
            return {"status": "error", "message": f"Erro ao criar planilha: {str(e)}"}
        
        
        
        
        
    def datamigration(self, planilha_cliente):
        try:
            if not planilha_cliente.endswith('.xlsx'):
                planilha_cliente = planilha_cliente + '.xlsx'
            
            if not self.output_path.exists():
                self.createnewxlsx()
            
            arquivo_cliente = self.client_path / planilha_cliente
            
            if not arquivo_cliente.exists():
                return {
                    "status": "error",
                    "message": f"Arquivo do cliente não encontrado: {arquivo_cliente}"
                }
            
            self.df_base = pd.read_excel(str(self.output_path))
            self.df_cliente = pd.read_excel(str(arquivo_cliente))

            mapeamentos = [
                (self.id_cliente, self.id),
                (self.codigo_cliente, self.codigo),
                (self.nome_cliente, self.nome),
                (self.descricao_cliente, self.descricao),
                (self.preco_cliente, self.preco),
                (self.grupo_cliente, self.grupo),
                (self.subgrupo_cliente, self.subgrupo),
                (self.impressao_cliente, self.impressao),
                (self.ncm_cliente, self.ncm),
                (self.cest_cliente, self.cest),
                (self.uncompra_cliente, self.uncompra),
                (self.unvendas_cliente, self.unvendas),
                (self.pesavel_cliente, self.pesavel),
                (self.fracionado_cliente, self.fracionado),
                (self.exportarbalanca_cliente, self.exportarbalanca),
                (self.classificacao_cliente, self.classificacao),
            ]
            
            colunas_mapeadas = []
            for col_cliente, col_base in mapeamentos:
                if col_cliente and col_cliente in self.df_cliente.columns:
                    self.df_base[col_base] = self.df_cliente[col_cliente]
                    colunas_mapeadas.append(f"{col_cliente} → {col_base}")

            arquivo_saida = self.planilhas_path / "Planilha_migrada.xlsx"
            self.df_base.to_excel(str(arquivo_saida), index=False)
            
            return {
                "status": "success",
                "message": "Migração de dados concluída com sucesso",
                "arquivo_saida": str(arquivo_saida),
                "colunas_mapeadas": colunas_mapeadas,
                "linhas_processadas": len(self.df_base)
            }

        except KeyError as e:
            return {
                "status": "error",
                "message": f"Coluna não encontrada: {e}",
                "detail": f"Verifique se a coluna '{e}' existe no arquivo cliente."
            }
        except Exception as e:
            import traceback
            return {
                "status": "error",
                "message": f"Erro de migração de dados: {type(e).__name__}",
                "detail": str(e),
                "traceback": traceback.format_exc()
            }