"""
A股每日收盘大盘数据自动化报告
基于 AKShare（免费、无需注册）

Docker 部署版本 - 适用于绿联云 NAS
数据来源：东方财富、同花顺
"""

import akshare as ak
import pandas as pd
from datetime import datetime, timedelta
import sys
import os
import time

# ============================================================
# 配置
# ============================================================
OUTPUT_DIR = "/app/output"


def get_trade_date(date_str=None):
    """获取交易日期"""
    if date_str:
        return date_str
    today = datetime.now()
    weekday = today.weekday()
    if weekday == 5:
        today = today - timedelta(days=1)
    elif weekday == 6:
        today = today - timedelta(days=2)
    return today.strftime("%Y%m%d")


def get_index_data(trade_date):
    """获取主要指数实时行情"""
    print(f"\n{'='*60}")
    print(f"【主要指数】 {trade_date}")
    print("=" * 60)

    results = {}
    indices = {
        '上证指数': '000001',
        '深证成指': '399001',
        '沪深300': '000300',
        '中证500': '000905',
        '中证1000': '000852',
        '上证50': '000016',
        '创业板指': '399006',
        '科创50': '000688',
    }

    try:
        # 东方财富实时指数行情
        df = ak.stock_zh_index_spot_em()
        if df is not None and not df.empty:
            for name, code in indices.items():
                row = df[df['代码'] == code]
                if not row.empty:
                    row = row.iloc[0]
                    close = row.get('最新价', 0)
                    pct = row.get('涨跌幅', 0)
                    amount = row.get('成交额', 0) / 100000000  # 转为亿
                    results[name] = {'close': close, 'pct_chg': pct, 'amount': amount}
                    print(f"  {name:8s}: {close:>10.2f}  ({pct:+.2f}%)  成交额:{amount:.0f}亿")
                else:
                    print(f"  {name:8s}: 无数据")
    except Exception as e:
        print(f"  获取失败: {e}")

    return results


def get_market_overview(trade_date):
    """获取全市场涨跌统计"""
    print(f"\n{'='*60}")
    print(f"【市场概况】 {trade_date}")
    print("=" * 60)

    try:
        # 东方财富全部A股实时行情
        df = ak.stock_zh_a_spot_em()
        if df is None or df.empty:
            print("  无数据")
            return {}, None

        total = len(df)
        red = len(df[df['涨跌幅'] > 0])
        green = len(df[df['涨跌幅'] < 0])
        flat = len(df[df['涨跌幅'] == 0])
        total_amount = df['成交额'].sum() / 100000000  # 转为亿

        print(f"  总股票数:   {total} 家")
        print(f"  红盘个股:   {red} 家 ({red/total*100:.1f}%)")
        print(f"  绿盘个股:   {green} 家 ({green/total*100:.1f}%)")
        print(f"  平盘个股:   {flat} 家")
        print(f"  成交额合计: {total_amount:.2f} 亿元")

        market_data = {
            'total': total,
            'red': red,
            'green': green,
            'flat': flat,
            'total_amount': total_amount
        }
        return market_data, df

    except Exception as e:
        print(f"  获取失败: {e}")
        return {}, None


def get_limit_up_pool(trade_date):
    """获取涨停板池（含连板信息）"""
    print(f"\n{'='*60}")
    print(f"【涨停板数据】 {trade_date}")
    print("=" * 60)

    results = {'zt_count': 0, 'dt_count': 0, 'zt_list': [], 'dt_list': []}

    try:
        # 涨停股池
        date_fmt = f"{trade_date[:4]}{trade_date[4:6]}{trade_date[6:]}"
        zt_df = ak.stock_zt_pool_em(date=date_fmt)
        if zt_df is not None and not zt_df.empty:
            results['zt_count'] = len(zt_df)
            results['zt_list'] = zt_df
            print(f"  涨停数: {len(zt_df)} 家")

            # 连板梯队
            if '连板数' in zt_df.columns:
                zt_df_sorted = zt_df.sort_values('连板数', ascending=False)
                max_board = zt_df_sorted['连板数'].max()
                print(f"  最高连板: {max_board} 板")
                print()
                for n in range(int(max_board), 0, -1):
                    stocks = zt_df_sorted[zt_df_sorted['连板数'] == n]
                    if not stocks.empty:
                        names = stocks['名称'].tolist()[:10]
                        print(f"  {n}连板({len(stocks)}家): {', '.join(names)}")
        else:
            print("  涨停数据: 无数据")

    except Exception as e:
        print(f"  涨停池获取失败: {e}")

    print()

    try:
        # 跌停股池
        date_fmt = f"{trade_date[:4]}{trade_date[4:6]}{trade_date[6:]}"
        dt_df = ak.stock_zt_pool_dtgc_em(date=date_fmt)
        if dt_df is not None and not dt_df.empty:
            results['dt_count'] = len(dt_df)
            results['dt_list'] = dt_df
            print(f"  跌停数: {len(dt_df)} 家")
        else:
            print("  跌停数据: 无数据")
    except Exception as e:
        print(f"  跌停池获取失败: {e}")

    return results


def get_sector_performance(trade_date):
    """获取行业板块涨幅排名"""
    print(f"\n{'='*60}")
    print(f"【行业板块排名】 {trade_date}")
    print("=" * 60)

    try:
        df = ak.stock_board_industry_name_em()
        if df is not None and not df.empty:
            df = df.sort_values('涨跌幅', ascending=False)

            print("  【涨幅前10】")
            for _, row in df.head(10).iterrows():
                name = row.get('板块名称', '')
                pct = row.get('涨跌幅', 0)
                print(f"    {name:12s}: {pct:+.2f}%")

            print(f"\n  【跌幅前5】")
            for _, row in df.tail(5).iterrows():
                name = row.get('板块名称', '')
                pct = row.get('涨跌幅', 0)
                print(f"    {name:12s}: {pct:+.2f}%")

            return df
        else:
            print("  无数据")
    except Exception as e:
        print(f"  获取失败: {e}")

    return None


def get_concept_performance(trade_date):
    """获取概念板块涨幅排名"""
    print(f"\n{'='*60}")
    print(f"【概念板块排名】 {trade_date}")
    print("=" * 60)

    try:
        df = ak.stock_board_concept_name_em()
        if df is not None and not df.empty:
            df = df.sort_values('涨跌幅', ascending=False)

            print("  【涨幅前10】")
            for _, row in df.head(10).iterrows():
                name = row.get('板块名称', '')
                pct = row.get('涨跌幅', 0)
                print(f"    {name:12s}: {pct:+.2f}%")

            return df
    except Exception as e:
        print(f"  获取失败: {e}")

    return None


def get_north_flow(trade_date):
    """获取北向资金数据"""
    print(f"\n{'='*60}")
    print(f"【北向资金】 {trade_date}")
    print("=" * 60)

    try:
        df = ak.stock_hsgt_north_net_flow_in_em(symbol="北向资金")
        if df is not None and not df.empty:
            # 获取最近一天的数据
            latest = df.iloc[-1]
            net_flow = latest.get('当日净流入', 0)
            if isinstance(net_flow, (int, float)):
                net_flow_yi = net_flow / 100000000 if abs(net_flow) > 10000 else net_flow
                status = "净流入" if net_flow_yi > 0 else "净流出"
                print(f"  北向资金: {status} {abs(net_flow_yi):.2f} 亿")
                return {'net_flow': net_flow_yi}
            else:
                print(f"  北向资金: {net_flow}")
    except Exception as e:
        print(f"  获取失败: {e}")

    return {}


def get_dragon_tiger(trade_date):
    """获取龙虎榜数据"""
    print(f"\n{'='*60}")
    print(f"【龙虎榜】 {trade_date}")
    print("=" * 60)

    try:
        # 格式化日期
        date_fmt = f"{trade_date[:4]}-{trade_date[4:6]}-{trade_date[6:]}"
        df = ak.stock_lhb_detail_em(
            start_date=date_fmt,
            end_date=date_fmt
        )
        if df is not None and not df.empty:
            print(f"  上榜个股数: {df['代码'].nunique()} 家")
            print()
            # 显示前10
            seen = set()
            count = 0
            for _, row in df.iterrows():
                code = row.get('代码', '')
                if code not in seen and count < 10:
                    seen.add(code)
                    name = row.get('名称', code)
                    reason = row.get('解读', '')
                    print(f"    {name:8s} ({code})  {reason}")
                    count += 1
        else:
            print("  无数据（龙虎榜通常T+1公布）")
    except Exception as e:
        print(f"  获取失败: {e}")


def analyze_volume_top(all_stocks_df, trade_date):
    """成交额排行"""
    print(f"\n{'='*60}")
    print(f"【成交额TOP10】 {trade_date}")
    print("=" * 60)

    if all_stocks_df is None or all_stocks_df.empty:
        print("  无数据")
        return

    try:
        top10 = all_stocks_df.nlargest(10, '成交额')
        for i, (_, row) in enumerate(top10.iterrows(), 1):
            name = row.get('名称', '')
            code = row.get('代码', '')
            amount_yi = row.get('成交额', 0) / 100000000
            pct = row.get('涨跌幅', 0)
            print(f"  {i:2d}. {name:6s}({code}) 成交额:{amount_yi:.2f}亿  涨跌:{pct:+.2f}%")
    except Exception as e:
        print(f"  获取失败: {e}")


def generate_summary(trade_date, index_data, market_data, limit_data, north_data):
    """生成文字总结"""
    print(f"\n{'='*60}")
    print(f"【{trade_date} 大盘总结】")
    print("=" * 60)

    if not market_data:
        print("  数据不足，无法生成总结")
        return ""

    sh = index_data.get('上证指数', {})
    sz = index_data.get('深证成指', {})
    cy = index_data.get('创业板指', {})

    red_pct = market_data['red'] / max(market_data['total'], 1) * 100
    amount = market_data['total_amount']

    # 情绪判断
    if red_pct > 70:
        emotion = "强势，赚钱效应极好"
    elif red_pct > 60:
        emotion = "偏多，赚钱效应好"
    elif red_pct > 50:
        emotion = "中性偏多"
    elif red_pct > 40:
        emotion = "中性偏空"
    elif red_pct > 30:
        emotion = "偏空，亏钱效应明显"
    else:
        emotion = "极弱，大面积亏钱"

    north_str = ""
    if north_data:
        nf = north_data.get('net_flow', 0)
        north_str = f"  北向资金: {'净流入' if nf > 0 else '净流出'} {abs(nf):.2f} 亿"

    summary = f"""
  上证 {sh.get('close', '-')} ({sh.get('pct_chg', 0):+.2f}%)
  深证 {sz.get('close', '-')} ({sz.get('pct_chg', 0):+.2f}%)
  创业板 {cy.get('close', '-')} ({cy.get('pct_chg', 0):+.2f}%)

  红盘 {market_data['red']} 家({red_pct:.1f}%) | 绿盘 {market_data['green']} 家
  成交额 {amount:.0f} 亿
  涨停 {limit_data.get('zt_count', '?')} 家 | 跌停 {limit_data.get('dt_count', '?')} 家
{north_str}
  市场情绪: {emotion}
"""
    print(summary)
    return summary


def export_to_excel(trade_date, index_data, market_data, limit_data, all_stocks_df,
                    sector_df, concept_df, north_data, summary):
    """导出到 Excel 文件"""
    filename = os.path.join(OUTPUT_DIR, f"大盘数据_{trade_date}.xlsx")

    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
        # Sheet1: 总结
        summary_df = pd.DataFrame([{
            '日期': trade_date,
            '上证指数': index_data.get('上证指数', {}).get('close', ''),
            '上证涨跌%': index_data.get('上证指数', {}).get('pct_chg', ''),
            '深证成指': index_data.get('深证成指', {}).get('close', ''),
            '深证涨跌%': index_data.get('深证成指', {}).get('pct_chg', ''),
            '创业板指': index_data.get('创业板指', {}).get('close', ''),
            '创业板涨跌%': index_data.get('创业板指', {}).get('pct_chg', ''),
            '红盘数': market_data.get('red', 0),
            '绿盘数': market_data.get('green', 0),
            '红盘比例%': round(market_data.get('red', 0) / max(market_data.get('total', 1), 1) * 100, 1),
            '成交额(亿)': round(market_data.get('total_amount', 0), 2),
            '涨停数': limit_data.get('zt_count', 0),
            '跌停数': limit_data.get('dt_count', 0),
            '北向净流入(亿)': round(north_data.get('net_flow', 0), 2) if north_data else '',
        }])
        summary_df.to_excel(writer, sheet_name='总结', index=False)

        # Sheet2: 指数详情
        if index_data:
            idx_df = pd.DataFrame([
                {'指数': name, '收盘': data['close'], '涨跌幅%': data['pct_chg'],
                 '成交额(亿)': round(data.get('amount', 0), 2)}
                for name, data in index_data.items()
            ])
            idx_df.to_excel(writer, sheet_name='指数', index=False)

        # Sheet3: 涨幅TOP20
        if all_stocks_df is not None:
            top20 = all_stocks_df.nlargest(20, '涨跌幅')[['代码', '名称', '最新价', '涨跌幅', '成交额']]
            top20['成交额(亿)'] = (top20['成交额'] / 100000000).round(2)
            top20.to_excel(writer, sheet_name='涨幅TOP20', index=False)

        # Sheet4: 跌幅TOP20
        if all_stocks_df is not None:
            bottom20 = all_stocks_df.nsmallest(20, '涨跌幅')[['代码', '名称', '最新价', '涨跌幅', '成交额']]
            bottom20['成交额(亿)'] = (bottom20['成交额'] / 100000000).round(2)
            bottom20.to_excel(writer, sheet_name='跌幅TOP20', index=False)

        # Sheet5: 行业板块
        if sector_df is not None:
            sector_df.to_excel(writer, sheet_name='行业板块', index=False)

        # Sheet6: 概念板块TOP20
        if concept_df is not None:
            concept_df.head(20).to_excel(writer, sheet_name='概念板块TOP20', index=False)

    print(f"\n✅ 数据已导出到: {filename}")


def save_summary(trade_date, summary):
    """保存文字总结"""
    summary_file = os.path.join(OUTPUT_DIR, f"总结_{trade_date}.txt")
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(f"{trade_date} A股大盘总结\n")
        f.write("=" * 40 + "\n")
        f.write(summary)
    print(f"  总结已保存: {summary_file}")


# ============================================================
# 主程序
# ============================================================
def main():
    print("╔══════════════════════════════════════════════════════════╗")
    print("║      A股每日收盘大盘数据报告 (AKShare 免费版)             ║")
    print("╚══════════════════════════════════════════════════════════╝")

    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 获取日期参数
    if len(sys.argv) > 1:
        trade_date = sys.argv[1]
    else:
        trade_date = get_trade_date()

    print(f"\n📅 交易日期: {trade_date}")
    print(f"📂 输出目录: {OUTPUT_DIR}")

    # 检查是否为周末
    trade_dt = datetime.strptime(trade_date, "%Y%m%d")
    if trade_dt.weekday() >= 5:
        print(f"\n⚠️  {trade_date} 是周末，跳过执行")
        return

    # 1. 指数数据
    index_data = get_index_data(trade_date)
    time.sleep(1)

    # 2. 市场概况
    market_data, all_stocks_df = get_market_overview(trade_date)
    time.sleep(1)

    # 3. 涨跌停数据 & 连板梯队
    limit_data = get_limit_up_pool(trade_date)
    time.sleep(1)

    # 4. 行业板块排名
    sector_df = get_sector_performance(trade_date)
    time.sleep(1)

    # 5. 概念板块排名
    concept_df = get_concept_performance(trade_date)
    time.sleep(1)

    # 6. 北向资金
    north_data = get_north_flow(trade_date)
    time.sleep(1)

    # 7. 龙虎榜
    get_dragon_tiger(trade_date)
    time.sleep(1)

    # 8. 成交额排行
    analyze_volume_top(all_stocks_df, trade_date)

    # 9. 生成总结
    summary = generate_summary(trade_date, index_data, market_data, limit_data, north_data)

    # 10. 导出 Excel
    export_to_excel(trade_date, index_data, market_data, limit_data,
                    all_stocks_df, sector_df, concept_df, north_data, summary)

    # 11. 保存文字总结
    if summary:
        save_summary(trade_date, summary)

    print("\n✅ 报告生成完毕！")


if __name__ == "__main__":
    main()
