import { NextResponse } from "next/server";

// Pre-defined lessons for now
// Will be replaced with AI-generated content later
const LESSONS: Record<string, { title: string; content: string; tip: string }> =
  {
    first_watering: {
      title: "Your First Income!",
      content:
        "Congratulations! You just earned your first money by watering your tree. In real life, this is like earning money from working hard. The more you work (water), the more you earn!",
      tip: "Save some of your earnings - don't spend everything at once!",
    },
    first_savings: {
      title: "Smart Saver!",
      content:
        "You put money in your savings account! This is one of the smartest things you can do. Your money will grow a little bit every day, even while you sleep!",
      tip: "Even small savings add up over time. Start early!",
    },
    first_fd: {
      title: "Investment Master!",
      content:
        "You created a Fixed Deposit! This means you've locked your money for a while, but it will grow much faster than regular savings. This is like planting a seed and waiting for it to become a big tree.",
      tip: "FDs give better returns but you can't use that money for a while. Plan accordingly!",
    },
    bought_depreciating: {
      title: "The True Cost of Things",
      content:
        "You bought something that gives you a boost now but will cost you later! Things like bikes, scooters, and cars are useful, but they need maintenance and lose value over time. Think carefully before buying!",
      tip: "Ask yourself: Do I really need this, or do I just want it?",
    },
    bought_appreciating: {
      title: "Smart Investment!",
      content:
        "You bought an asset that grows in value! Things like gold and land become more valuable over time. This is how wealthy people grow their money - they buy things that become worth more!",
      tip: "Be patient with appreciating assets. The longer you wait, the more they're worth!",
    },
    maintenance_started: {
      title: "The Hidden Costs",
      content:
        "Your vehicle boost has ended and now you're paying for maintenance! This is like real life - cars and bikes need fuel, repairs, and care. Sometimes the cost of owning something is more than the cost of buying it!",
      tip: "Always think about ongoing costs, not just the purchase price.",
    },
    low_money: {
      title: "Money Management",
      content:
        "Your wallet is getting empty! This is a good reminder to always keep some money saved for emergencies. In real life, unexpected things happen and having savings helps a lot.",
      tip: "Try to always keep at least a small amount saved for emergencies.",
    },
    default: {
      title: "Daily Summary",
      content:
        "Great job today! You're learning important lessons about money. Remember: earn, save, invest, and spend wisely!",
      tip: "The best time to start saving is today. The second best time is also today!",
    },
  };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { triggers = [], day = 1 } = body;

    // Find the most relevant lesson based on triggers
    let lessonKey = "default";
    for (const trigger of triggers) {
      if (LESSONS[trigger]) {
        lessonKey = trigger;
        break;
      }
    }

    const lesson = LESSONS[lessonKey];

    return NextResponse.json({
      day,
      title: lesson.title,
      content: lesson.content,
      tip: lesson.tip,
      basedOn: triggers,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate lesson" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Lesson API",
    availableTriggers: Object.keys(LESSONS),
  });
}
