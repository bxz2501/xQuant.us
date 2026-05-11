"use client";

import { useLocale } from "@/components/locale-provider";

type Entry = { q: string; a: string };

const FAQ_EN: Entry[] = [
  {
    q: "Can you share your trading formula with me?",
    a: "I don't have a single formula. Trading decisions come from a lot of code, using statistical analysis and machine learning, and each stock is different — I sometimes don't even know why an order was placed.",
  },
  {
    q: "Can you give me the code? I won't tell anyone.",
    a: "If I gave it to you, what would you say when your friends ask you the same question?",
  },
  {
    q: "Can you give me the program? I just want to see how you wrote it; I won't trade the way you do.",
    a: "If you don't follow my approach but tweak the parameters and place orders ahead of mine, it becomes very hard for me to keep trading. Losing my own money is one thing, but that would be very unfair to my investors and put them at risk — I can't do that.",
  },
  {
    q: "I want to research trading programs. What do I need to know?",
    a: "Everyone has a different research direction. My suggestion: pick up some finance knowledge about stocks, statistics, programming, AI, databases, network security, and so on.",
  },
  {
    q: "Your return is 24%. I'll lend you the money — you only need to guarantee me a 20% return.",
    a: "Thanks, but I don't borrow money to invest in stocks. Besides, I can borrow from my broker at only 8% interest — I don't see why I'd pay 20%.",
  },
  {
    q: "You have such a good investment opportunity — why didn't you tell your old buddies?",
    a: "My friends fall into two camps. The first, when I tell them, clutch their wallets, eyes wide, asking \"what are you trying to pull?\" The second ask me why I didn't tell them. You're in the second camp.",
  },
  {
    q: "How can I join your fund?",
    a: "Because of legal restrictions, I haven't completed all the paperwork yet, so I can only take small amounts from a very limited number of people. I also need to do my own due diligence to make sure I can manage things responsibly. If you're interested, get in touch and I'll start preparing.",
  },
  {
    q: "What is your investment strategy?",
    a: "Long only, no shorts. The money normally sits in SPY ETF; when an opportunity arises, I sell SPY and buy stocks. When a sell signal hits, I sell the stocks and buy back SPY. In backtesting, the strategy beats SPY by about 8% per year on average. Past performance does not predict future returns.",
  },
  {
    q: "Do you trade mainland China stocks?",
    a: "Backtesting has been successful. I'm currently building the program for automated trading.",
  },
  {
    q: "I graduated from a top university — if I wanted to study stock trading, I should do better than you.",
    a: "Completely agree. The trading API has a free-text field on each order — you can put your university's name there.",
  },
  {
    q: "Which book got you started in trading?",
    a: "I never read one. I started after seeing \"experts\" on TV say stocks tend to keep rising after breaking the 52-week high and keep falling after breaking the 52-week low. So I wrote a program to test it — turned out to be groundless. Then experts said stocks would be cheaper before April 15 because everyone has to sell to pay taxes. I wrote a program to short stocks on April 1 and cover on April 15 — and it didn't make money either.",
  },
  {
    q: "I have a strategy. Can we work together to turn it into a program?",
    a: "I don't really recommend it. Secrets shouldn't be shared. Besides, there's a good chance I can point out a flaw in your model within five minutes, or disprove it with data within two hours.",
  },
  {
    q: "Stocks are the easiest, right?",
    a: "I think the stock market is the fairest, but probably not the easiest.",
  },
  {
    q: "If I join, will the money be in my account or yours?",
    a: "For now it's in your own account. The brokerage is Charles Schwab.",
  },
  {
    q: "Whose account trades first?",
    a: "There's no advantage to trading first, and which account goes first is random.",
  },
];

const FAQ_ZH: Entry[] = [
  {
    q: "能否把你交易的公式告诉我？",
    a: "我没有一个公式，交易的决策是由很多代码，通过数理统计和机器学习的结果做出判断，每个股票都不一样，我甚至无从知道为什么下单。",
  },
  {
    q: "能否将代码给我？我不会告诉别人。",
    a: "如果我给了你，你的朋友问你这个问题怎么办？",
  },
  {
    q: "能否将程序给我？我只是看看你怎么写，不会按你的方法交易。",
    a: "如果你不照我的方法，把参数调在我之前下单，我的交易就很难继续了，我自己输了没关系，但这对我的投资者非常不公平，也给他们带来风险，我不能这么做。",
  },
  {
    q: "我想研究股票交易程序，需要哪些知识？",
    a: "每个人的研究方向不一样，我的建议是你需要学点关于股票的金融知识，统计学，编程，人工智能，数据库，网络安全等等。",
  },
  {
    q: "你的投资回报有24%，我把钱借给你，你只需要保证我20%的回报就可以了。",
    a: "谢谢，但我不借钱投资股票，再说我向券商借钱，利息只要8%，不懂得为什么我要去借20%的利息。",
  },
  {
    q: "你有这么好的投资机会，为什么没有告诉昔日的兄弟？",
    a: "我有两类朋友，一类是我说了，一听捂住钱包，睁大眼睛说你想干什么？另一类是问我为什么没有告诉他。你刚好是第二类。",
  },
  {
    q: "如何加入你的投资？",
    a: "因为有法律限制，我还没有做好完全手续，只能吸收极少数人的少量资金。我也需要进行研究，保证能有效管理才能加入。有意者可以和我联系，我好准备。",
  },
  {
    q: "你的投资策略是什么？",
    a: "只做多，不做空，平时钱投入 SPY ETF，当机会来的时候，卖出 SPY，买入股票。当卖出信号发生时，卖出股票，买入 SPY。测试结果是平均每年超过 SPY 回报 8%。当然过往的表现无法预测未来的回报。",
  },
  {
    q: "你有没有做中国大陆股票？",
    a: "测试已经成功，正在写程序进行自动交易。",
  },
  {
    q: "我是名牌大学毕业，应该可以比你做得更好，如果我想研究股票的话。",
    a: "完全同意。API 在下单时有一个自由字节的 field，你可以把你大学名字写在上面。",
  },
  {
    q: "你是看哪本书开始研究交易的？",
    a: "没有看过书。开始研究是从电视看到\"专家\"说股票突破 52 星期高点就会往上再涨一阵，低于 52 星期低点就会继续跌一些。于是我写程序验证，发现毫无根据。接着是电视上专家说 4 月 15 日之前因为大家需要卖股票去交税，股票会比较低。我写程序在 4 月 1 日卖空股票，4 月 15 日低点买回来，结果发现并没有赚钱。",
  },
  {
    q: "我有一个策略，我们一起合作写成程序可以吗？",
    a: "不是很建议，机密不应该跟别人说，不过大概率我能在五分钟之内指出你的模型有缺陷，或者在两个小时内用数据测试证明策略无效。",
  },
  {
    q: "股票是最容易的，是吧？",
    a: "我觉得股票市场是最公平的，但可能不是最容易的。",
  },
  {
    q: "如果我要加入的话，钱是我自己的户头还是你的户头？",
    a: "目前是你自己户头，开户券商是 Charles Schwab。",
  },
  {
    q: "谁的账户先交易？",
    a: "先交易没有任何好处，而谁先交易是随机的。",
  },
];

export default function FaqPage() {
  const { locale, t } = useLocale();
  const items = locale === "zh" ? FAQ_ZH : FAQ_EN;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">{t("faq.title")}</h2>
        <p className="text-sm text-text-secondary mt-1">{t("faq.subtitle")}</p>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-lg border border-border-glass bg-bg-card p-4"
          >
            <h3 className="font-semibold text-text-primary mb-2">
              {i + 1}. {item.q}
            </h3>
            <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
