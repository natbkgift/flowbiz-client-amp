from packages.core.phase1.schemas import ChatProgress, ChatState, Purpose


def next_chat_state(progress: ChatProgress) -> ChatState:
    if progress.user_requested_human:
        return ChatState.ESCALATION

    if progress.contains_restricted_question:
        return ChatState.ESCALATION

    if progress.attempts_unparsed >= 2:
        return ChatState.ESCALATION

    if progress.state == ChatState.GREETING:
        return ChatState.PURPOSE

    if progress.state == ChatState.PURPOSE:
        if progress.purpose == Purpose.BUY_LIVE:
            return ChatState.BUYER
        if progress.purpose == Purpose.BUY_INVEST:
            return ChatState.INVESTOR
        if progress.purpose == Purpose.RENT:
            return ChatState.RENTER
        if progress.purpose == Purpose.EXPLORING:
            return ChatState.EXPLORER
        return ChatState.PURPOSE

    if progress.state in {ChatState.BUYER, ChatState.INVESTOR, ChatState.RENTER}:
        if progress.budget_range and progress.timeline:
            return ChatState.CONTACT
        return progress.state

    if progress.state == ChatState.EXPLORER:
        return ChatState.CONTACT if progress.chat_started else ChatState.END

    if progress.state == ChatState.CONTACT:
        if progress.contact_captured:
            return ChatState.CONFIRMATION
        return ChatState.CONTACT

    if progress.state == ChatState.CONFIRMATION:
        return ChatState.END

    return ChatState.END
