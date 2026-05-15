"""
A股每日收盘大盘数据自动化报告
基于 Tushare Pro 接口

使用前准备：
1. 注册 Tushare Pro: https://tushare.pro/register
2. 获取 token: https://tushare.pro/user/token
3. 安装依赖: pip install tushare pandas openpyxl
4. 将下方 TUSHARE_TOKEN 替换为你的 token

每日收盘后运行（建议 15:30 之后）：
    python stock_daily_report.py

可选参数：
    python stock_daily_report.py 20260508    # 指定日期
"""

import tushare as ts
import pandas as pd
from datetime import datetime, timedelta
import sys
import os

# ============================================================
# 配置区域 - 请替换为你的 Tushare Token
# ============================================================
TUSHARE_TOKEN = "你的token放这里"

# 初始化
ts.set_token(TUSHARE_TOKEN)
pro = ts.pro_api()


def get_trade_date(date_str=None):
    """获取交易日期，默认为最近一个交易日"""
    if date_str:
        return date_str
    # 获取交易日历，找最近的交易日
    today = datetime.now().strftime("%Y%m%d")
    cal = pro.trade_cal(exchange='SSE', start_date=(datetime.now() - timedelta(days=10)).strftime("%Y%m%d"),
                        end_date=today)
    trade_days = cal[cal['is_open'] == 1]['cal_date'].tolist()
    if trade_days:
        return trade_days[-1]
    return today


def get_index_data(trade_date):
    """获取主要指数收盘数据"""
    print("\n" + "=" * 60)
    print(f"【指数数据】 {trade_date}")
    print("=" * 60)

    indices = {
        '000001.SH': '上证指数',
        '399001.SZ': '深证成指',
        '000300.SH': '沪深300',
        '000905.SH': '中证500',
        '000852.SH': '中证1000',
        '000016.SH': '上证50',
        '399006.SZ': '创业板指',
        '000688.SH': '科创50',
    }

    results = {}
    for code, name in indices.items():
        try:
            df = pro.index_daily(ts_code=code, start_date=trade_date, end_date=trade_date)
            if not df.empty:
                row = df.iloc[0]
                pct = row['pct_chg']
                close = row['close']
                amount = row['amount'] / 100000  # 转为亿元
                results[name] = {'close': close, 'pct_chg': pct, 'amount': amount}
                print(f"  {name:8s}: {close:>10.2f}  ({pct:+.2f}%)")
            else:
                print(f"  {name:8s}: 无数据")
        except Exception as e:
            print(f"  {name:8s}: 获取失败 - {e}")

    return results


def get_market_overview(trade_date):
    """获取全市场涨跌统计"""
    print("\n" + "=" * 60)
    print(f"【市场概况】 {trade_date}")
    print("=" * 60)

    try:
        # 获取全市场日线数据
        df = pro.daily(trade_date=trade_date)
        if df.empty:
            print("  无数据")
            return {}

        total = len(df)
        red = len(df[df['pct_chg'] > 0])
        green = len(df[df['pct_chg'] < 0])
        flat = len(df[df['pct_chg'] == 0])

        # 成交额合计（万元 -> 亿元）
        total_amount = df['amount'].sum() / 100000

        print(f"  总股票数:   {total} 家")
        print(f"  红盘个股:   {red} 家 ({red/total*100:.1f}%)")
        print(f"  绿盘个股:   {green} 家 ({green/total*100:.1f}%)")
        print(f"  平盘个股:   {flat} 家")
        print(f"  成交额合计: {total_amount:.2f} 亿元")

        return {
            'total': total,
            'red': red,
            'green': green,
            'flat': flat,
            'total_amount': total_amount
        }
    except Exception as e:
        print(f"  获取失败: {e}")
        return {}


def get_limit_stocks(trade_date):
    """获取涨跌停数据"""
    print("\n" + "=" * 60)
    print(f"【涨跌停数据】 {trade_date}")
    print("=" * 60)

    results = {'zt_count': 0, 'dt_count': 0, 'zt_stocks': [], 'dt_stocks': []}

    try:
        # 涨跌停统计 - 使用 stk_limit 接口
        # 或者通过 daily 数据自行计算
        df = pro.daily(trade_date=trade_date)
        if df.empty:
            return results

        # 获取涨跌停价格信息
        limit_df = pro.stk_limit(trade_date=trade_date)

        if not limit_df.empty:
            # 合并数据
            merged = df.merge(limit_df[['ts_code', 'up_limit', 'down_limit']],
                              on='ts_code', how='left')

            # 涨停：收盘价 >= 涨停价
            zt = merged[merged['close'] >= merged['up_limit']]
            # 跌停：收盘价 <= 跌停价
            dt = merged[merged['close'] <= merged['down_limit']]

            results['zt_count'] = len(zt)
            results['dt_count'] = len(dt)
            results['zt_stocks'] = zt['ts_code'].tolist()
            results['dt_stocks'] = dt['ts_code'].tolist()

            print(f"  涨停数: {len(zt)} 家")
            print(f"  跌停数: {len(dt)} 家")
        else:
            # 备用方案：通过涨幅判断（不完全准确，但可用）
            zt_approx = df[df['pct_chg'] >= 9.8]
            dt_approx = df[df['pct_chg'] <= -9.8]
            results['zt_count'] = len(zt_approx)
            results['dt_count'] = len(dt_approx)
            print(f"  涨停数(估算): {len(zt_approx)} 家")
            print(f"  跌停数(估算): {len(dt_approx)} 家")

    except Exception as e:
        print(f"  获取失败: {e}")
        # 备用方案
        try:
            df = pro.daily(trade_date=trade_date)
            zt = df[df['pct_chg'] >= 9.8]
            dt = df[df['pct_chg'] <= -9.8]
            results['zt_count'] = len(zt)
            results['dt_count'] = len(dt)
            print(f"  涨停数(估算): {len(zt)} 家")
            print(f"  跌停数(估算): {len(dt)} 家")
        except:
            pass

    return results


def get_limit_up_list(trade_date):
    """获取涨停板详细列表（含连板信息）"""
    print("\n" + "=" * 60)
    print(f"【涨停板详情 & 连板梯队】 {trade_date}")
    print("=" * 60)

    try:
        # Tushare Pro 的涨停板列表接口
        df = pro.limit_list_d(trade_date=trade_date, limit_type='U')  # U=涨停

        if df.empty:
            print("  无数据（可能需要更高积分权限）")
            return None

        # 按连板数排序
        if 'limit_times' in df.columns:
            df = df.sort_values('limit_times', ascending=False)

            # 连板梯队
            max_board = df['limit_times'].max()
            print(f"  最高连板: {max_board} 板")
            print(f"  涨停总数: {len(df)} 家")
            print()

            for n in range(int(max_board), 0, -1):
                stocks = df[df['limit_times'] == n]
                if not stocks.empty:
                    names = stocks['name'].tolist() if 'name' in stocks.columns else stocks['ts_code'].tolist()
                    print(f"  {n}连板({len(stocks)}家): {', '.join(names[:10])}")

        return df

    except Exception as e:
        print(f"  获取失败: {e}")
        print("  提示: limit_list_d 接口需要 Tushare 积分 >= 2000")
        print("  替代方案: 使用 daily 数据自行统计连板")
        return None


def get_sector_performance(trade_date):
    """获取板块涨幅排名"""
    print("\n" + "=" * 60)
    print(f"【板块涨幅排名】 {trade_date}")
    print("=" * 60)

    try:
        # 申万行业指数日线
        df = pro.index_daily(ts_code='', trade_date=trade_date)
        # 或者使用同花顺概念板块
        # 注意：Tushare 的板块数据可能需要额外接口

        # 使用申万行业分类
        sw_df = pro.sw_daily(trade_date=trade_date)
        if not sw_df.empty:
            sw_df = sw_df.sort_values('pct_change', ascending=False)
            print("  【涨幅前10】")
            for _, row in sw_df.head(10).iterrows():
                print(f"    {row.get('name', row['ts_code']):10s}: {row['pct_change']:+.2f}%")
            print("\n  【跌幅前5】")
            for _, row in sw_df.tail(5).iterrows():
                print(f"    {row.get('name', row['ts_code']):10s}: {row['pct_change']:+.2f}%")
        else:
            print("  板块数据为空，尝试其他接口...")

    except Exception as e:
        print(f"  获取失败: {e}")
        print("  提示: 可使用 ths_index (同花顺概念指数) 替代")


def get_dragon_tiger(trade_date):
    """获取龙虎榜数据"""
    print("\n" + "=" * 60)
    print(f"【龙虎榜数据】 {trade_date}")
    print("=" * 60)

    try:
        # 龙虎榜每日明细
        df = pro.top_list(trade_date=trade_date)
        if not df.empty:
            # 按买入金额排序
            if 'buy' in df.columns:
                df_sorted = df.sort_values('buy', ascending=False)
            else:
                df_sorted = df

            print(f"  上榜个股数: {df['ts_code'].nunique()} 家")
            print()

            # 显示前10
            seen = set()
            count = 0
            for _, row in df_sorted.iterrows():
                code = row['ts_code']
                if code not in seen and count < 10:
                    seen.add(code)
                    name = row.get('name', code)
                    reason = row.get('reason', '')
                    buy = row.get('buy', 0) / 10000  # 转万元
                    sell = row.get('sell', 0) / 10000
                    print(f"    {name:8s} 买入:{buy:>10.0f}万 卖出:{sell:>10.0f}万 原因:{reason}")
                    count += 1
        else:
            print("  无数据")

    except Exception as e:
        print(f"  获取失败: {e}")


def get_global_market():
    """获取全球市场数据"""
    print("\n" + "=" * 60)
    print("【全球市场】")
    print("=" * 60)

    global_indices = {
        'DJI': '道琼斯',
        'SPX': '标普500',
        'IXIC': '纳斯达克',
        'HSI': '恒生指数',
        'HSTECH': '恒生科技',
    }

    try:
        # Tushare 全球指数
        for code, name in global_indices.items():
            try:
                df = pro.index_global(ts_code=code)
                if not df.empty:
                    row = df.iloc[0]
                    print(f"  {name:8s}: {row['close']:>10.2f}  ({row.get('pct_chg', 0):+.2f}%)")
            except:
                pass
    except Exception as e:
        print(f"  获取失败: {e}")


def get_turnover_comparison(trade_date):
    """成交额与前日对比"""
    try:
        # 获取前一个交易日
        cal = pro.trade_cal(exchange='SSE',
                            start_date=(datetime.strptime(trade_date, "%Y%m%d") - timedelta(days=10)).strftime("%Y%m%d"),
                            end_date=trade_date)
        trade_days = cal[cal['is_open'] == 1]['cal_date'].tolist()

        if len(trade_days) >= 2:
            prev_date = trade_days[-2]
            curr_date = trade_days[-1]

            df_curr = pro.daily(trade_date=curr_date)
            df_prev = pro.daily(trade_date=prev_date)

            curr_amount = df_curr['amount'].sum() / 100000  # 亿元
            prev_amount = df_prev['amount'].sum() / 100000

            diff = curr_amount - prev_amount
            status = "放量" if diff > 0 else "缩量"

            print(f"\n  成交额变化: {status} {abs(diff):.2f} 亿元")
            print(f"  今日: {curr_amount:.2f} 亿 | 昨日: {prev_amount:.2f} 亿")

            return {'curr': curr_amount, 'prev': prev_amount, 'diff': diff}
    except Exception as e:
        print(f"  成交额对比获取失败: {e}")

    return {}


def export_to_excel(trade_date, index_data, market_data, limit_data):
    """导出到 Excel 文件"""
    filename = f"大盘数据_{trade_date}.xlsx"

    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
        # Sheet1: 指数数据
        if index_data:
            idx_df = pd.DataFrame([
                {'指数': name, '收盘': data['close'], '涨跌幅%': data['pct_chg']}
                for name, data in index_data.items()
            ])
            idx_df.to_excel(writer, sheet_name='指数', index=False)

        # Sheet2: 市场概况
        if market_data:
            mkt_df = pd.DataFrame([market_data])
            mkt_df.columns = ['总股票数', '红盘', '绿盘', '平盘', '成交额(亿)']
            mkt_df.to_excel(writer, sheet_name='市场概况', index=False)

    print(f"\n✅ 数据已导出到: {filename}")


def generate_summary(trade_date, index_data, market_data, limit_data, turnover_data):
    """生成文字总结"""
    print("\n" + "=" * 60)
    print(f"【{trade_date} 大盘总结】")
    print("=" * 60)

    if not index_data or not market_data:
        print("  数据不足，无法生成总结")
        return

    sh_pct = index_data.get('上证指数', {}).get('pct_chg', 0)
    sz_pct = index_data.get('深证成指', {}).get('pct_chg', 0)
    cy_pct = index_data.get('创业板指', {}).get('pct_chg', 0)

    red_pct = market_data.get('red', 0) / max(market_data.get('total', 1), 1) * 100
    amount = market_data.get('total_amount', 0)

    turnover_status = ""
    if turnover_data:
        diff = turnover_data.get('diff', 0)
        turnover_status = f"{'放量' if diff > 0 else '缩量'}{abs(diff):.0f}亿"

    # 情绪判断
    if red_pct > 60 and sh_pct > 0.5:
        emotion = "偏多，赚钱效应好"
    elif red_pct > 50:
        emotion = "中性偏多"
    elif red_pct > 40:
        emotion = "中性偏空"
    else:
        emotion = "偏空，亏钱效应明显"

    print(f"""
  上证 {sh_pct:+.2f}% | 深证 {sz_pct:+.2f}% | 创业板 {cy_pct:+.2f}%
  红盘 {market_data.get('red', 0)} 家({red_pct:.1f}%) | 绿盘 {market_data.get('green', 0)} 家
  成交额 {amount:.0f} 亿 ({turnover_status})
  涨停 {limit_data.get('zt_count', '?')} 家 | 跌停 {limit_data.get('dt_count', '?')} 家
  市场情绪: {emotion}
""")


# ============================================================
# 主程序
# ============================================================
def main():
    print("╔══════════════════════════════════════════════════════════╗")
    print("║          A股每日收盘大盘数据报告 (Tushare Pro)           ║")
    print("╚══════════════════════════════════════════════════════════╝")

    # 获取日期参数
    if len(sys.argv) > 1:
        trade_date = sys.argv[1]
    else:
        trade_date = get_trade_date()

    print(f"\n📅 交易日期: {trade_date}")

    # 1. 指数数据
    index_data = get_index_data(trade_date)

    # 2. 市场概况（涨跌家数、成交额）
    market_data = get_market_overview(trade_date)

    # 3. 成交额对比
    turnover_data = get_turnover_comparison(trade_date)

    # 4. 涨跌停数据
    limit_data = get_limit_stocks(trade_date)

    # 5. 涨停板详情 & 连板梯队
    get_limit_up_list(trade_date)

    # 6. 板块涨幅排名
    get_sector_performance(trade_date)

    # 7. 龙虎榜
    get_dragon_tiger(trade_date)

    # 8. 全球市场
    get_global_market()

    # 9. 生成总结
    generate_summary(trade_date, index_data, market_data, limit_data, turnover_data)

    # 10. 导出 Excel
    export_to_excel(trade_date, index_data, market_data, limit_data)

    print("\n✅ 报告生成完毕！")


if __name__ == "__main__":
    main()
